import { updateEnquiry } from "@/app/admin/actions";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { Card, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { whatsappLink } from "@/config/site";
import { requireAdmin } from "@/lib/admin";
import { formatDate, formatDateTime } from "@/lib/format";
import type { EnquiryStatus } from "@/lib/types";

const STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quote sent",
  confirmed: "Confirmed",
  closed: "Closed",
};

type Enquiry = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  event_date: string | null;
  quantity: string | null;
  items_of_interest: string[];
  message: string | null;
  status: EnquiryStatus;
  admin_note: string | null;
  created_at: string;
};

// Every admin page checks the login before rendering anything, so navigations wait for the server.
export const instant = false;

export default async function AdminEnquiries() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("corporate_enquiries").select("*").order("created_at", { ascending: false }).limit(200);
  const enquiries = (data ?? []) as Enquiry[];

  if (!enquiries.length) return <p className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">No enquiries yet.</p>;

  return (
    <ul className="space-y-4">
      <AutoRefresh seconds={120} />
      {enquiries.map((e) => (
        <li key={e.id}>
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-serif text-2xl">
                  {e.name} {e.status === "new" && <Pill tone="warn">New</Pill>}
                </p>
                <p className="text-sm text-muted">
                  {e.company && `${e.company} · `}Received {formatDateTime(e.created_at)}
                </p>
              </div>
              <a href={whatsappLink(`91${e.phone}`, `Hi ${e.name.split(" ")[0]}! Thank you for your enquiry with SM Delights.`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#1f8f4c] px-4 py-2 text-sm text-white">
                <WhatsAppIcon width={18} height={18} /> {e.phone}
              </a>
            </div>
            <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              <div><dt className="text-muted">Event date</dt><dd>{e.event_date ? formatDate(e.event_date) : "—"}</dd></div>
              <div><dt className="text-muted">Quantity</dt><dd>{e.quantity ?? "—"}</dd></div>
              <div><dt className="text-muted">Interested in</dt><dd>{e.items_of_interest.join(", ") || "—"}</dd></div>
              {e.email && <div><dt className="text-muted">Email</dt><dd><a href={`mailto:${e.email}`} className="underline">{e.email}</a></dd></div>}
            </dl>
            {e.message && <p className="mt-4 whitespace-pre-line rounded-xl bg-cream p-3 text-sm">{e.message}</p>}
            <form action={updateEnquiry} className="mt-4 grid gap-3 sm:grid-cols-[12rem_1fr_auto] sm:items-end">
              <input type="hidden" name="id" value={e.id} />
              <div>
                <label htmlFor={`st-${e.id}`} className="label">Status</label>
                <select id={`st-${e.id}`} name="status" defaultValue={e.status} className="field py-2">
                  {(Object.keys(STATUS_LABEL) as EnquiryStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor={`nt-${e.id}`} className="label">Private note</label>
                <input id={`nt-${e.id}`} name="admin_note" defaultValue={e.admin_note ?? ""} className="field py-2" placeholder="Quoted ₹… on WhatsApp" />
              </div>
              <Button type="submit" variant="secondary">Save</Button>
            </form>
          </Card>
        </li>
      ))}
    </ul>
  );
}
