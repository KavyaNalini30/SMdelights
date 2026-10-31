import { Card } from "@/components/admin/ui";
import { ZoneForm } from "@/components/admin/ZoneForm";
import { requireAdmin } from "@/lib/admin";
import type { DeliveryZone } from "@/lib/types";

export default async function AdminZones() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("delivery_zones").select("*").order("sort");
  const zones = (data ?? []) as (DeliveryZone & { is_active: boolean })[];

  return (
    <div className="space-y-4">
      <div className="max-w-2xl space-y-2 text-sm text-muted">
        <p>
          Courier charges are worked out at checkout from the customer&apos;s pincode and the parcel weight (the weights
          are set on each product size). Enter the rates from the ST Courier rate card: the price for the first slab,
          then the price for every extra slab.
        </p>
        <p>
          Items marked “Not for courier” (drinks, London Cake, the combo) can only be picked up or sent by fast delivery
          in Chennai. Fast delivery is agreed on WhatsApp, so it has no price here. Pickup is always free.
        </p>
      </div>
      {zones.map((z) => (
        <Card key={z.id}>
          <ZoneForm zone={z} active={z.is_active} />
        </Card>
      ))}
    </div>
  );
}
