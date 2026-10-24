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
      <p className="max-w-2xl text-sm text-muted">
        The fee is added at checkout based on the customer&apos;s pincode. Drinks and other “Chennai only” items can only be
        delivered within Chennai. Pickup is always free.
      </p>
      {zones.map((z) => (
        <Card key={z.id}>
          <ZoneForm zone={z} active={z.is_active} />
        </Card>
      ))}
    </div>
  );
}
