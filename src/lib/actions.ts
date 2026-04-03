"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth, signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function register(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !confirmPassword) {
    return { error: "Tous les champs sont requis" };
  }

  if (password !== confirmPassword) {
    return { error: "Les mots de passe ne correspondent pas" };
  }

  if (password.length < 6) {
    return { error: "Le mot de passe doit contenir au moins 6 caractères" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "Un compte avec cet email existe déjà" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: name || null,
    },
  });

  return { success: true };
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email et mot de passe requis" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/mounts/muldos",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email ou mot de passe incorrect" };
        default:
          return { error: "Une erreur est survenue" };
      }
    }
    throw error;
  }

  return { success: true };
}

export async function updateMountCount(
  mountId: number,
  field: "maleCount" | "femaleCount",
  value: number,
  mountType: string
) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Non authentifié" };
  }

  const userId = session.user.id;

  // Si les deux compteurs sont à 0, on supprime l'entrée
  if (value === 0) {
    const existing = await prisma.userMount.findUnique({
      where: { userId_mountId: { userId, mountId } },
    });

    if (existing) {
      const otherField = field === "maleCount" ? "femaleCount" : "maleCount";
      const otherValue = existing[otherField];

      if (otherValue === 0) {
        await prisma.userMount.delete({
          where: { userId_mountId: { userId, mountId } },
        });
        revalidatePath(`/mounts/${mountType}`);
        return { success: true };
      }
    }
  }

  await prisma.userMount.upsert({
    where: {
      userId_mountId: {
        userId,
        mountId,
      },
    },
    update: {
      [field]: value,
    },
    create: {
      userId,
      mountId,
      [field]: value,
    },
  });

  revalidatePath(`/mounts/${mountType}`);
  return { success: true };
}

// === Breeding Plans ===

export async function saveBreedingPlan(data: {
  mountId: number;
  parentLevel: number;
  xpTier: number;
  numEnclosures: number;
  gen1Multiplier: number;
  useCloning: boolean;
  useOptimakina: boolean;
  useReproducteur: boolean;
  note?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non authentifié" };

  const plan = await prisma.breedingPlan.create({
    data: {
      userId: session.user.id,
      ...data,
    },
  });

  revalidatePath("/optimizer");
  return { success: true, planId: plan.id };
}

export async function deleteBreedingPlan(planId: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non authentifié" };

  await prisma.breedingPlan.deleteMany({
    where: { id: planId, userId: session.user.id },
  });

  revalidatePath("/optimizer");
  return { success: true };
}
