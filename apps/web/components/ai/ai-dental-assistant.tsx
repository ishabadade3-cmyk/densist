"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PresetQuestion {
  label: string;
  query: string;
  answer: string;
  category: "treatment" | "emergency" | "general" | "booking";
  suggestedAction?: {
    label: string;
    href: string;
  };
}

const PRESET_QUESTIONS: PresetQuestion[] = [
  {
    label: "Root Canal Pain?",
    query: "Is a root canal treatment painful?",
    category: "treatment",
    answer:
      "Modern root canal therapy at Densistt is virtually pain-free. We use profound local anaesthesia and gentle rotary micro-instruments. Most patients describe it as no more uncomfortable than a routine filling, and it immediately relieves severe toothaches caused by infected pulp.",
    suggestedAction: {
      label: "Book Appointment",
      href: "/book",
    },
  },
  {
    label: "Clear Aligners vs Braces",
    query: "What is the difference between clear aligners and metal braces?",
    category: "treatment",
    answer:
      "Clear aligners are custom-crafted, nearly invisible plastic trays that gradually straighten teeth without metal wires or brackets. They can be removed for eating and brushing, making oral hygiene much easier. Traditional or ceramic braces remain fixed on teeth and are ideal for more complex bite corrections.",
    suggestedAction: {
      label: "Explore Aligners",
      href: "/services/braces-and-aligners",
    },
  },
  {
    label: "Dental Implants Lifespan",
    query: "How long do dental implants last?",
    category: "treatment",
    answer:
      "Dental implants are designed to be a permanent, lifelong solution for missing teeth. Composed of medical-grade titanium that fuses naturally with jawbone tissue, they boast a 95% to 98% long-term success rate when paired with good oral hygiene and routine 6-month checkups.",
    suggestedAction: {
      label: "Book Appointment",
      href: "/book",
    },
  },
  {
    label: "Sudden Toothache Advice",
    query: "What should I do if I have a sudden, severe toothache?",
    category: "emergency",
    answer:
      "For acute toothache, rinse gently with warm salt water and avoid biting hard foods on that side. Do not place aspirin directly on the gums as it can cause chemical burns. If you experience rapidly spreading facial swelling, fever, or difficulty swallowing, contact our clinic immediately for emergency triage.",
    suggestedAction: {
      label: "Contact Emergency",
      href: "/contact",
    },
  },
  {
    label: "Clinic Hours & Location",
    query: "What are your operating hours and where are you located?",
    category: "general",
    answer:
      "Densistt Dental Clinic is conveniently located in Thane West, Maharashtra. We welcome patients Monday through Saturday from 9:00 AM to 8:00 PM, and on Sundays by prior appointment for specialized procedures.",
    suggestedAction: {
      label: "Get Directions",
      href: "/contact",
    },
  },
  {
    label: "Teeth Whitening Safety",
    query: "Does professional laser teeth whitening damage enamel?",
    category: "treatment",
    answer:
      "No. In-office laser whitening supervised by our dental surgeons is clinically proven to be safe. The whitening gel safely breaks down pigment stains on enamel without stripping the mineral structure of your teeth. Mild temporary sensitivity, if any, subsides within 24 to 48 hours.",
    suggestedAction: {
      label: "Book Whitening",
      href: "/book",
    },
  },
];

export function AIDentalAssistant() {
  const [selectedQuestion, setSelectedQuestion] = React.useState<PresetQuestion>(PRESET_QUESTIONS[0]);
  const [customInput, setCustomInput] = React.useState("");
  const [conversation, setConversation] = React.useState<Array<{ role: "user" | "assistant"; text: string; action?: { label: string; href: string } }>>([
    {
      role: "assistant",
      text: PRESET_QUESTIONS[0].answer,
      action: PRESET_QUESTIONS[0].suggestedAction,
    },
  ]);
  const [isTyping, setIsTyping] = React.useState(false);

  const handleSelectPreset = (preset: PresetQuestion) => {
    setSelectedQuestion(preset);
    setIsTyping(true);
    setTimeout(() => {
      setConversation((prev) => [
        ...prev,
        { role: "user", text: preset.query },
        { role: "assistant", text: preset.answer, action: preset.suggestedAction },
      ]);
      setIsTyping(false);
    }, 350);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = customInput.trim();
    if (!query) return;

    setCustomInput("");
    setConversation((prev) => [...prev, { role: "user", text: query }]);
    setIsTyping(true);

    try {
      const response = await fetch("/api/v1/assistant/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversation((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.answer || "Thank you for asking. For an accurate clinical evaluation of your symptoms, we recommend scheduling an in-person dental consultation with our specialists.",
            action: { label: "Book Appointment", href: "/book" },
          },
        ]);
        setIsTyping(false);
        return;
      }
    } catch {
      // Fallback to local triage if API is unreachable
    }

    // Local smart matcher
    setTimeout(() => {
      const lower = query.toLowerCase();
      let answer = "For personalized dental advice and diagnostic imaging, we invite you to book a consultation with our dental specialists.";
      let action = { label: "Book Appointment", href: "/book" };

      if (lower.includes("pain") || lower.includes("hurt") || lower.includes("root canal")) {
        answer = "Tooth pain often signals deep decay, nerve inflammation, or gum infection. Our pain-free root canal and conservative treatments relieve discomfort quickly and preserve your natural tooth.";
        action = { label: "Schedule Consultation", href: "/book" };
      } else if (lower.includes("implant") || lower.includes("missing")) {
        answer = "Dental implants are permanent titanium tooth roots that restore natural chewing and smile aesthetics. We offer digital 3D-planned implant restorations tailored to your jaw structure.";
        action = { label: "Explore Dental Implants", href: "/services/dental-implants" };
      } else if (lower.includes("aligner") || lower.includes("brace") || lower.includes("straight")) {
        answer = "Clear aligners discreetly straighten teeth, close gaps, and correct bite alignment with comfortable, transparent trays that you can take out during meals.";
        action = { label: "Clear Aligners Info", href: "/services/braces-and-aligners" };
      } else if (lower.includes("cost") || lower.includes("price") || lower.includes("fee")) {
        answer = "We believe in 100% transparent pricing with zero commercial overtreatment. Following an in-person examination and digital radiograph, we provide a clear, itemized treatment estimate before any procedure begins.";
        action = { label: "Book Consultation", href: "/book" };
      } else if (lower.includes("bleed") || lower.includes("gum")) {
        answer = "Bleeding gums are a common sign of gingivitis or tartar buildup below the gumline. Gentle ultrasonic scaling and regular cleanings reverse gum inflammation and keep teeth secure.";
        action = { label: "Gum Treatment Details", href: "/services/gum-treatment" };
      } else if (lower.includes("emergency") || lower.includes("swelling") || lower.includes("trauma")) {
        answer = "If you are experiencing severe facial swelling, continuous bleeding, or acute dental trauma, please do not wait. Call our clinic emergency helpline immediately or visit an emergency room.";
        action = { label: "Emergency Contact", href: "/contact" };
      }

      setConversation((prev) => [...prev, { role: "assistant", text: answer, action }]);
      setIsTyping(false);
    }, 450);
  };

  return (
    <div className="rounded-2xl bg-card border border-border shadow-md overflow-hidden">
      {/* Assistant Header */}
      <div className="p-6 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center font-serif text-xl font-bold">
            ✨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-xl font-bold">AI Dental Assistant</h3>
              <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold uppercase tracking-wider">
                Instant Help
              </span>
            </div>
            <p className="text-xs text-primary-foreground/80 mt-0.5">
              Instant guidance on treatments, dental FAQs, oral hygiene, and appointments.
            </p>
          </div>
        </div>

        <Link href="/book">
          <Button variant="secondary" size="sm" className="font-semibold shadow-xs shrink-0">
            Book Appointment
          </Button>
        </Link>
      </div>

      {/* Preset Quick Chips */}
      <div className="p-4 bg-muted/30 border-b border-border flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mr-1">
          Popular Questions:
        </span>
        {PRESET_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectPreset(q)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-fast ${
              selectedQuestion.label === q.label
                ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-accent/40"
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Window */}
      <div className="p-6 flex flex-col gap-4 max-h-[360px] overflow-y-auto bg-background/50">
        {conversation.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col gap-1.5 max-w-[85%] ${
              msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {msg.role === "user" ? "You" : "Densistt Dental Assistant"}
            </div>
            <div
              className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-xs"
                  : "bg-card text-foreground border border-border shadow-xs rounded-bl-xs"
              }`}
            >
              {msg.text}
            </div>

            {msg.action && (
              <div className="mt-1">
                <Link href={msg.action.href}>
                  <Button variant="outline" size="sm" className="text-xs font-semibold hover:border-primary">
                    {msg.action.label} &rarr;
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="mr-auto flex items-center gap-2 p-3 bg-card border border-border rounded-xl text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span>Finding verified dental guidance...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleCustomSubmit} className="p-4 bg-card border-t border-border flex items-center gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Ask about symptoms, aligners, implants, or dental hygiene..."
          className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          aria-label="Ask the AI Dental Assistant"
        />
        <Button type="submit" variant="primary" size="md" className="shrink-0 font-semibold">
          Ask Assistant
        </Button>
      </form>

      {/* Strict Medical Disclaimer per Section 7 */}
      <div className="p-3 bg-muted/40 border-t border-border text-[11px] text-muted-foreground/80 text-center leading-normal">
        <span className="font-semibold text-foreground">Medical Disclaimer: </span>
        The AI Dental Assistant provides general educational guidance only and does not replace professional dental diagnosis, radiographs, or prescriptions. For definitive care, please schedule an in-person consultation with our dental surgeons.
      </div>
    </div>
  );
}
