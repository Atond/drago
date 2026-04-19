import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type FuelPriceRow = {
  fuelId: number;
  price: number;
};

async function ensureFuelPriceTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "GlobalFuelPrice" (
      "fuelId" INTEGER NOT NULL,
      "price" INTEGER NOT NULL,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "GlobalFuelPrice_pkey" PRIMARY KEY ("fuelId")
    );
  `);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureFuelPriceTable();

  const rows = await prisma.$queryRaw<FuelPriceRow[]>`
    SELECT "fuelId", "price"
    FROM "GlobalFuelPrice"
  `;

  const prices = rows.reduce<Record<number, number>>((acc, row) => {
    acc[row.fuelId] = row.price;
    return acc;
  }, {});

  return NextResponse.json({ prices });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updatesInput = Array.isArray(body.updates)
    ? body.updates
    : body.prices && typeof body.prices === "object"
      ? Object.entries(body.prices).map(([fuelId, price]) => ({ fuelId, price }))
      : null;

  if (!updatesInput) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updates = updatesInput
    .map((entry: unknown) => {
      const obj = entry as { fuelId?: number | string; price?: number | string };
      return {
        fuelId: Number.parseInt(String(obj.fuelId), 10),
        price: Number.parseInt(String(obj.price), 10),
      };
    })
    .filter(
      (e: { fuelId: number; price: number }) =>
        Number.isInteger(e.fuelId) &&
        e.fuelId > 0 &&
        Number.isInteger(e.price) &&
        e.price >= 0,
    );

  await ensureFuelPriceTable();

  await prisma.$transaction(async (tx) => {
    for (const entry of updates) {
      if (entry.price <= 0) {
        await tx.$executeRaw`
          DELETE FROM "GlobalFuelPrice"
          WHERE "fuelId" = ${entry.fuelId}
        `;
        continue;
      }

      await tx.$executeRaw`
        INSERT INTO "GlobalFuelPrice" ("fuelId", "price", "updatedAt")
        VALUES (${entry.fuelId}, ${entry.price}, NOW())
        ON CONFLICT ("fuelId")
        DO UPDATE SET "price" = EXCLUDED."price", "updatedAt" = NOW()
      `;
    }
  });

  return NextResponse.json({ ok: true, count: updates.length });
}
