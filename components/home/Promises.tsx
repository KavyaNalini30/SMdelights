import { GiftIcon, HeartIcon, LeafIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/motion/Reveal";

// The four promises from the client's own menu poster.
const items = [
  { icon: HeartIcon, title: "Home-made", text: "Baked with care in our Kolathur kitchen." },
  { icon: LeafIcon, title: "Premium ingredients", text: "Rich, fudgy and made with quality ingredients." },
  { icon: SparkIcon, title: "Customisable", text: "Choose your flavours for brownie boxes and cookie tins." },
  { icon: GiftIcon, title: "Perfect for gifting", text: "Family boxes, cookie tins and bulk orders for every occasion." },
];

export function Promises() {
  return (
    <section aria-label="Why SM Delights" className="border-y border-line bg-paper/60">
      <ul className="container-page grid grid-cols-2 gap-x-6 gap-y-8 py-10 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text }, i) => (
          <Reveal as="li" key={title} delay={i * 0.06} className="flex flex-col items-start gap-2">
            <Icon className="text-caramel" width={26} height={26} />
            <h2 className="font-serif text-xl">{title}</h2>
            <p className="text-sm leading-relaxed text-muted">{text}</p>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

function SparkIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden {...p}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  );
}
