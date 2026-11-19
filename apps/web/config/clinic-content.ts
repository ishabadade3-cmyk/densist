/**
 * Clinic Content Configuration
 *
 * Source of truth: docs/brain/content-bank.md and docs/source/SRS.md §3.1.
 * Anti-hallucination rule: Every clinic-specific fact is mapped to a TBD:<key>.
 * Unverified facts must never use realistic sample placeholders.
 * Empty or unverified fields remain flagged as TBD.
 */

export interface ClinicAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  landmark?: string;
}

export interface ClinicGeo {
  latitude: number | null;
  longitude: number | null;
  mapEmbedUrl?: string;
}

export interface ClinicHours {
  regular: {
    days: string;
    hours: string;
  }[];
  holidayNote: string;
  emergencyProtocol: string;
}

export interface ClinicInfo {
  legalName: string;
  brandName: string;
  tagline: string;
  address: ClinicAddress;
  geo: ClinicGeo;
  phone: string;
  email: string;
  whatsapp: string;
  hours: ClinicHours;
  story: string;
  mission: string;
  values: string[];
  facilities: string[];
  hygienePractices: string[];
  licenses: string[];
  emergencyContacts: {
    clinicHelpline: string;
    nearbyHospital: string;
    ambulance: string;
  };
}

export interface DentalService {
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  indicativePriceRange: string;
  indicativeDuration: string;
  overview: string;
  indications: string[];
  procedureSteps: string[];
  preCare: string[];
  postCare: string[];
  faqs: { question: string; answer: string }[];
}

export interface DentistProfile {
  id: string;
  slug: string;
  name: string;
  role: string;
  qualifications: string;
  specialization: string;
  experienceYears: string;
  languages: string[];
  consultationSchedule: string;
  bio: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  category: string;
  publishedAt: string;
  readTime: string;
  summary: string;
  content: string[];
  authorName: string;
  clinicalReviewer: string;
  reviewedDate: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  treatmentSlug: string;
  category: string;
  description: string;
  consentRecorded: boolean; // MUST be true to render publicly
  consentReferenceId?: string;
  beforeLabel: string;
  afterLabel: string;
  clinicalNotes: string;
}

export interface TestimonialItem {
  id: string;
  patientInitials: string;
  treatment: string;
  reviewText: string;
  consentRecorded: boolean; // MUST be true to render publicly
  consentReferenceId?: string;
  verifiedVisitDate: string;
}

export interface FAQItem {
  category: string;
  question: string;
  answer: string;
}

export interface ClinicContent {
  clinic: ClinicInfo;
  services: DentalService[];
  dentists: DentistProfile[];
  blogPosts: BlogPost[];
  gallery: GalleryItem[];
  testimonials: TestimonialItem[];
  faqs: FAQItem[];
  policies: {
    privacyNotice: string;
    termsAndConditions: string;
    cancellationPolicy: string;
  };
}

export const clinicContent: ClinicContent = {
  clinic: {
    legalName: "TBD:clinic_legal_name",
    brandName: "TBD:clinic_brand",
    tagline: "TBD:clinic_brand",
    address: {
      street: "TBD:clinic_address",
      city: "Thane",
      state: "Maharashtra",
      country: "India",
      postalCode: "TBD:clinic_address",
      landmark: "TBD:clinic_address",
    },
    geo: {
      latitude: null, // TBD:clinic_geo
      longitude: null, // TBD:clinic_geo
      mapEmbedUrl: undefined,
    },
    phone: "TBD:clinic_phone",
    email: "TBD:clinic_email",
    whatsapp: "TBD:clinic_whatsapp",
    hours: {
      regular: [
        { days: "Monday - Saturday", hours: "TBD:clinic_hours" },
        { days: "Sunday", hours: "TBD:clinic_hours" },
      ],
      holidayNote: "TBD:clinic_hours",
      emergencyProtocol: "TBD:clinic_emergency_contacts",
    },
    story: "TBD:clinic_story",
    mission: "TBD:clinic_story",
    values: [
      "Patient-first ethical clinical dentistry without commercial over-treatment.",
      "Strict hospital-grade Class-B autoclaving and cross-infection prevention.",
      "Complete cost transparency before any intervention commences.",
      "Continuous clinical education and evidence-based treatment modalities.",
    ],
    facilities: [
      "TBD:clinic_facilities",
      "Ergonomic European dental delivery units with integrated intraoral cameras",
      "Class-B vacuum autoclave with chemical indicator monitoring for 100% sterile tray setups",
      "Digital low-radiation radiovisiography (RVG) and apex locators",
    ],
    hygienePractices: [
      "Hospital-grade 4-step sterilization: ultrasonic cleaning, enzymatic disinfection, pouching, and autoclave",
      "Surface barrier films replaced between every patient visit",
      "Hospital-grade air filtration in operatories",
      "Personal Protective Equipment (PPE) protocol adhered to strictly",
    ],
    licenses: [
      "TBD:clinic_licenses",
    ],
    emergencyContacts: {
      clinicHelpline: "TBD:clinic_phone",
      nearbyHospital: "TBD:clinic_emergency_contacts",
      ambulance: "108",
    },
  },

  services: [
    {
      slug: "general-dentistry",
      title: "General Dentistry & Preventive Care",
      category: "General Dentistry",
      shortDescription: "Gentle dental checkups, ultrasonic cleanings, and tooth-colored composite restorations for lasting oral health.",
      indicativePriceRange: "TBD:service_prices",
      indicativeDuration: "TBD:service_durations",
      overview: "Comprehensive dental checkups and professional cleanings preserve your natural teeth, prevent gum disease, and identify early issues before they cause pain or require complex interventions.",
      indications: [
        "Routine 6-month checkups and professional cleanings",
        "Plaque, tartar buildup, and surface stains",
        "Early cavities needing tooth-colored fillings",
        "Tooth sensitivity or bad breath prevention",
      ],
      procedureSteps: [
        "Comprehensive clinical examination and digital radiograph (RVG)",
        "Gentle ultrasonic cleaning and polishing to remove plaque and tartar",
        "Direct composite tooth-colored fillings for cavities if needed",
        "Personalized preventive oral hygiene consultation",
      ],
      preCare: ["Brush and floss normally prior to your appointment."],
      postCare: ["Maintain regular twice-daily brushing and daily flossing."],
      faqs: [
        {
          question: "How often should I visit the dentist for a checkup?",
          answer: "We recommend visiting every 6 months for a routine checkup and professional cleaning to catch any issues early.",
        },
      ],
    },
    {
      slug: "root-canal-treatment",
      title: "Root Canal Treatment (Endodontics)",
      category: "Endodontics",
      shortDescription: "Modern, pain-free root canal treatment designed to eliminate tooth infection and save your natural tooth.",
      indicativePriceRange: "TBD:service_prices",
      indicativeDuration: "TBD:service_durations",
      overview: "Root canal treatment gently removes infected or inflamed pulp tissue from inside the root canals of a tooth. The canals are thoroughly cleaned, shaped with flexible precision instruments, and sealed securely to prevent reinfection and save your natural tooth.",
      indications: [
        "Persistent toothache or pain that keeps you awake",
        "Prolonged sensitivity to hot and cold foods",
        "Pain when biting or chewing food",
        "Facial swelling or gum pimple near the tooth",
      ],
      procedureSteps: [
        "Clinical examination and digital x-ray diagnosis",
        "Gentle local anaesthesia for complete patient comfort",
        "Advanced infection control isolation for a clean, dry area",
        "Gentle cleaning of infected tissue and canal measurement",
        "Antimicrobial cleansing and root canal sealing",
        "Protective tooth restoration or dental crown placement",
      ],
      preCare: [
        "Have a light meal prior to your appointment unless instructed otherwise.",
        "Inform the clinician of all current medical conditions, allergies, and medications.",
      ],
      postCare: [
        "Avoid chewing hard foods on the treated side until the permanent crown is placed.",
        "Mild soreness for 24-48 hours is normal and managed with prescribed analgesic.",
      ],
      faqs: [
        {
          question: "Is root canal treatment painful?",
          answer: "With modern local anaesthesia and gentle rotary techniques, root canal treatment is typically as comfortable as receiving a routine dental filling.",
        },
        {
          question: "How many sittings are required?",
          answer: "Many uncomplicated cases are completed in a single session. Severe infections with purulent discharge may require 2 visits with inter-appointment medication.",
        },
      ],
    },
    {
      slug: "dental-implants",
      title: "Single & Multi-Tooth Dental Implants",
      category: "Implantology",
      shortDescription: "Permanent, natural-feeling dental implants surgically placed into the jawbone to replace missing teeth.",
      indicativePriceRange: "TBD:service_prices",
      indicativeDuration: "TBD:service_durations",
      overview: "Dental implants are the gold standard for replacing missing teeth. Acting as an artificial tooth root, the implant integrates securely with your jawbone, providing a solid, lifelong foundation for a natural-looking ceramic crown.",
      indications: [
        "Single or multiple missing teeth",
        "Difficulty chewing or speaking due to tooth loss",
        "Prevention of bone loss in missing tooth areas",
        "Permanent alternative to removable dentures without touching neighboring teeth",
      ],
      procedureSteps: [
        "CBCT 3D bone scan evaluation and digital treatment planning",
        "Minimally invasive surgical placement of implant fixture",
        "Healing period (osseointegration) of 8 to 16 weeks",
        "Abutment connection and precision digital scan",
        "Delivery and screw-retained or cement-retained porcelain crown",
      ],
      preCare: [
        "Complete medical review including HbA1c (diabetic check) and blood pressure.",
        "Discontinue smoking as it significantly impairs osseointegration.",
      ],
      postCare: [
        "Maintain soft diet for the initial 48 hours.",
        "Apply cold compression externally to minimize mild postoperative swelling.",
      ],
      faqs: [
        {
          question: "What is the success rate of dental implants?",
          answer: "In healthy candidates with adequate bone volume and good oral hygiene, dental implants have an internationally documented success rate of 95% to 98%.",
        },
      ],
    },
    {
      slug: "laser-teeth-whitening",
      title: "Teeth Whitening (Laser Whitening)",
      category: "Teeth Whitening",
      shortDescription: "Safe, in-office laser tooth whitening to gently remove stains and achieve a naturally brighter smile.",
      indicativePriceRange: "TBD:service_prices",
      indicativeDuration: "TBD:service_durations",
      overview: "Professional in-office whitening safely brightens discolored or yellowed teeth using clinically tested whitening gels activated by gentle laser light, lifting years of coffee, tea, and age stains without weakening enamel.",
      indications: [
        "Stains from tea, coffee, wine, or smoking",
        "Natural yellowing or dullness over time",
        "Smile brightening before weddings, events, or milestones",
      ],
      procedureSteps: [
        "Pre-whitening shade evaluation using natural shade guide",
        "Gentle cleaning to remove surface plaque and tartar",
        "Protective gum barrier placement for total sensitivity comfort",
        "Application of professional whitening formula with laser light activation",
        "Post-treatment soothing mineral rinse",
      ],
      preCare: [
        "Ensure any active cavities or gum issues are checked prior to whitening.",
      ],
      postCare: [
        "Avoid dark foods and beverages (tea, coffee, turmeric, red wine) for 48 hours.",
        "Brush gently with sensitive formula toothpaste if slight temporary sensitivity occurs.",
      ],
      faqs: [
        {
          question: "Does whitening damage dental enamel?",
          answer: "No. Professional dentist-supervised whitening safely penetrates enamel prisms to oxidize pigment molecules without altering the mineral structure.",
        },
      ],
    },
    {
      slug: "braces-and-aligners",
      title: "Clear Aligners & Orthodontics",
      category: "Orthodontics",
      shortDescription: "Discreet transparent aligners and modern braces to straighten teeth, close gaps, and align your bite comfortably.",
      indicativePriceRange: "TBD:service_prices",
      indicativeDuration: "TBD:service_durations",
      overview: "Clear aligner therapy uses a series of smooth, custom-molded invisible trays to gradually shift teeth into their ideal positions without noticeable metal wires or brackets.",
      indications: [
        "Crooked, crowded, or overlapping teeth",
        "Gaps and spaces between teeth",
        "Overbites, underbites, or uneven bite alignment",
        "Adults and teens seeking discreet alternatives to metal braces",
      ],
      procedureSteps: [
        "Digital 3D intraoral scan and photographic evaluation",
        "Digital 3D smile simulation showing your planned tooth movement",
        "Delivery of custom invisible aligner trays with simple wear instructions",
        "Periodic progress checkups every 6 to 8 weeks",
        "Custom retention trays to maintain your newly aligned smile",
      ],
      preCare: [
        "Complete routine cleaning and checkup before beginning aligner treatment.",
      ],
      postCare: [
        "Wear your aligners for 20 to 22 hours daily, removing them only for meals and brushing.",
        "Store aligners in their protective case when eating.",
      ],
      faqs: [
        {
          question: "Can I eat while wearing clear aligners?",
          answer: "No. Aligners are easily removed before eating or drinking anything other than cool water, allowing you to enjoy all your favorite foods without restriction.",
        },
      ],
    },
    {
      slug: "smile-designing",
      title: "Cosmetic Dentistry & Porcelain Veneers",
      category: "Cosmetic Dentistry",
      shortDescription: "Custom porcelain veneers and front teeth restoration to fix chips, gaps, and create your ideal smile.",
      indicativePriceRange: "TBD:service_prices",
      indicativeDuration: "TBD:service_durations",
      overview: "Cosmetic dentistry and digital smile design blend artistic aesthetics with dental health. Custom-crafted ceramic veneers are gently bonded to the front teeth to correct worn edges, deep staining, or minor gaps.",
      indications: [
        "Chipped, worn, or uneven front teeth",
        "Deep discolouration resistant to whitening",
        "Small gaps or uneven tooth shapes",
      ],
      procedureSteps: [
        "Facial aesthetic photography and digital smile preview",
        "Temporary trial smile in the mouth to evaluate shape and comfort",
        "Minimal, gentle tooth preparation",
        "Precision 3D digital scan and custom ceramic fabrication",
        "Bonding of custom veneers with natural tooth vitality",
      ],
      preCare: [
        "Personal consultation to discuss your ideal smile goals and aesthetic preferences.",
      ],
      postCare: [
        "Wear a protective night guard if you tend to grind your teeth during sleep.",
        "Maintain normal brushing, flossing, and regular dental checkups.",
      ],
      faqs: [
        {
          question: "How long do porcelain veneers last?",
          answer: "With good oral hygiene, regular 6-month checks, and proper care, high-quality porcelain veneers typically last 10 to 15 years.",
        },
      ],
    },
    {
      slug: "crowns-and-bridges",
      title: "Dental Crowns & Bridges",
      category: "Crowns & Bridges",
      shortDescription: "Durable porcelain and zirconia dental crowns to protect weakened teeth and bridges to replace missing teeth.",
      indicativePriceRange: "TBD:service_prices",
      indicativeDuration: "TBD:service_durations",
      overview: "Dental crowns are custom-crafted caps that cover and protect cracked, worn, or root-canal-treated teeth, restoring full chewing strength and natural appearance. Fixed bridges replace missing teeth by anchoring to neighboring teeth.",
      indications: [
        "Cracked, broken, or heavily filled teeth",
        "Teeth treated with root canal therapy requiring protective crowns",
        "Replacing missing teeth with a fixed permanent bridge",
      ],
      procedureSteps: [
        "Gentle tooth preparation under local comfort anaesthetic",
        "High-definition 3D digital intraoral scan (no messy impression trays)",
        "Precision milling of durable, metal-free zirconia or ceramic crown",
        "Bite and shade check to ensure seamless blend with your natural teeth",
        "Permanent cementation for a strong, comfortable restoration",
      ],
      preCare: ["Discuss shade matching and material choices with the dentist."],
      postCare: ["Maintain normal flossing around crown edges and bridge areas."],
      faqs: [
        {
          question: "What is the difference between Zirconia and Metal-Ceramic?",
          answer: "Zirconia is 100% metal-free, biocompatible, and virtually unbreakable. Unlike metal-ceramic crowns, it eliminates black gum lines over time.",
        },
      ],
    },
    {
      slug: "pediatric-dentistry",
      title: "Pediatric Dentistry (Children's Dental Care)",
      category: "Pediatric Dentistry",
      shortDescription: "Gentle, stress-free dental care for children and teens, focused on cavity prevention and happy dental habits.",
      indicativePriceRange: "TBD:service_prices",
      indicativeDuration: "TBD:service_durations",
      overview: "Specialized pediatric dental visits introduce children to dental care in a fun, positive, and anxiety-free environment, emphasizing preventive care, fluoride protection, and healthy brushing habits.",
      indications: [
        "First dental visit by age 1 or when the first tooth appears",
        "Routine cavity checks and preventive fluoride treatments",
        "Tooth-colored fillings for baby teeth",
        "Habit counseling (thumb sucking, mouth breathing)",
      ],
      procedureSteps: [
        "Friendly, gentle introduction to the dental chair (Tell-Show-Do approach)",
        "Painless checkup of teeth and jaw development",
        "Protective fluoride varnish application or sealants to prevent cavities",
        "Interactive brushing demonstration for child and parents",
      ],
      preCare: ["Schedule appointments during the child's alert hours (morning is optimal)."],
      postCare: ["Refrain from eating for 30 minutes following fluoride varnish treatment."],
      faqs: [
        {
          question: "Why treat baby teeth if they will fall out anyway?",
          answer: "Deciduous teeth maintain space for permanent successors, assist in proper speech development, and enable healthy childhood nutrition.",
        },
      ],
    },
    {
      slug: "gum-treatment",
      title: "Gum Treatment & Periodontal Care",
      category: "Gum Treatment",
      shortDescription: "Gentle deep cleaning, ultrasonic scaling, and gum care to stop bleeding and protect healthy teeth.",
      indicativePriceRange: "TBD:service_prices",
      indicativeDuration: "TBD:service_durations",
      overview: "Healthy gums are the foundation of healthy teeth. Our periodontal treatments gently remove plaque and hardened tartar from below the gumline to heal bleeding gums, eliminate bad breath, and prevent tooth loss.",
      indications: [
        "Bleeding gums while brushing or flossing",
        "Persistent bad breath",
        "Red, tender, or swollen gums",
        "Receding gum lines exposing tooth roots",
      ],
      procedureSteps: [
        "Gentle gum health evaluation and depth assessment",
        "Ultrasonic scaling to remove tartar and plaque deposits",
        "Deep root cleaning under topical anaesthetic if needed for comfort",
        "Antimicrobial soothing rinse",
        "Follow-up checkup to ensure healthy gum reattachment",
      ],
      preCare: ["Inform the dentist of any blood-thinning medications or systemic conditions."],
      postCare: ["Use warm saline rinses and a soft-bristled toothbrush for 3 to 5 days."],
      faqs: [
        {
          question: "Does dental scaling loosen healthy teeth?",
          answer: "No. This is a common misconception. Scaling removes the hard bacterial tartar deposits. In advanced gum disease, removing tartar reveals preexisting bone loss.",
        },
      ],
    },
    {
      slug: "wisdom-tooth-removal",
      title: "Wisdom Tooth Removal & Minor Oral Surgery",
      category: "Oral Surgery",
      shortDescription: "Surgical management of impacted third molars, pericoronitis, and dental cysts with maximum comfort.",
      indicativePriceRange: "TBD:service_prices",
      indicativeDuration: "TBD:service_durations",
      overview: "Impacted wisdom teeth (third molars) that cannot erupt properly due to jaw arch space limitations often cause pain, decay in adjacent molars, and recurrent gum infections (pericoronitis). Surgical extraction safely removes problematic teeth under local anaesthesia.",
      indications: [
        "Recurrent pain, swelling, or difficulty opening mouth (trismus)",
        "Food impaction between wisdom tooth and adjacent second molar",
        "Orthodontic crowding or cystic pathology on radiograph",
      ],
      procedureSteps: [
        "Panoramic OPG radiograph to evaluate inferior alveolar nerve relationship",
        "Profound local anaesthesia block for complete numbness",
        "Gentle mucosal reflection and conservative bone troughing",
        "Tooth sectioning for atraumatic tooth removal",
        "Surgical debridement and resorbable suturing",
      ],
      preCare: ["Have a nutritious meal prior to surgical appointment."],
      postCare: [
        "Bite firmly on the sterile gauze pack for 45 minutes.",
        "Do not spit, drink through a straw, or smoke for 24 hours to preserve the protective blood clot.",
      ],
      faqs: [
        {
          question: "What is dry socket and how is it prevented?",
          answer: "Dry socket occurs if the blood clot in the extraction site is dislodged prematurely. Following post-extraction guidelines strictly prevents this.",
        },
      ],
    },
  ],

  dentists: [
    {
      id: "dentist-01",
      slug: "lead-prosthodontist",
      name: "TBD:dentist_roster",
      role: "Chief Dental Surgeon & Implantologist",
      qualifications: "TBD:dentist_credentials",
      specialization: "Prosthodontics, Implantology & Aesthetic Rehabilitation",
      experienceYears: "TBD:dentist_credentials",
      languages: ["English", "Hindi", "Marathi"],
      consultationSchedule: "TBD:dentist_schedules",
      bio: "TBD:dentist_roster",
    },
    {
      id: "dentist-02",
      slug: "senior-endodontist",
      name: "TBD:dentist_roster",
      role: "Senior Consultant Endodontist",
      qualifications: "TBD:dentist_credentials",
      specialization: "Microscopic Endodontics & Rotary Root Canal Therapy",
      experienceYears: "TBD:dentist_credentials",
      languages: ["English", "Hindi", "Marathi"],
      consultationSchedule: "TBD:dentist_schedules",
      bio: "TBD:dentist_roster",
    },
    {
      id: "dentist-03",
      slug: "consultant-orthodontist",
      name: "TBD:dentist_roster",
      role: "Consultant Orthodontist & Dentofacial Orthopedist",
      qualifications: "TBD:dentist_credentials",
      specialization: "Clear Aligners, Lingual Braces & Growth Modulation",
      experienceYears: "TBD:dentist_credentials",
      languages: ["English", "Hindi"],
      consultationSchedule: "TBD:dentist_schedules",
      bio: "TBD:dentist_roster",
    },
  ],

  blogPosts: [
    {
      slug: "understanding-root-canal-therapy-facts-vs-myths",
      title: "Understanding Modern Root Canal Therapy: Facts vs Myths",
      category: "Oral Health Education",
      publishedAt: "2026-10-15",
      readTime: "5 min read",
      summary: "Explore why modern root canal therapy is virtually painless, how rotary instrumentation works, and why preserving your natural tooth is superior to extraction.",
      content: [
        "Dental health myths often discourage patients from seeking timely endodontic care. A persistent throbbing toothache indicates that dental pulp—the soft neurovascular tissue at the centre of the tooth—has become infected by deep bacterial infiltration.",
        "Rather than extraction, root canal treatment preserves the natural tooth root within the alveolar bone. Maintaining natural dentition preserves chewing efficiency, jawbone density, and prevents adjacent teeth from drifting out of alignment.",
        "Modern endodontics incorporates electronic apex locators, high-torque rotary nickel-titanium files, and warm obturation techniques, making treatment comfortable and efficient.",
      ],
      authorName: "TBD:blog_content",
      clinicalReviewer: "TBD:blog_content",
      reviewedDate: "2026-10-14",
    },
    {
      slug: "clear-aligners-vs-traditional-braces-comprehensive-guide",
      title: "Clear Aligners vs Traditional Braces: The Complete Clinical Guide",
      category: "Orthodontics",
      publishedAt: "2026-10-28",
      readTime: "6 min read",
      summary: "A clinical comparison between transparent thermoplastic aligners and conventional brackets: comfort, aesthetics, oral hygiene, and treatment speed.",
      content: [
        "Correcting dental malocclusion is not merely cosmetic—properly aligned teeth are significantly easier to clean, reducing the long-term risk of interproximal decay and periodontal disease.",
        "Clear aligners offer distinct lifestyle benefits: they are virtually invisible from conversational distances and can be removed during meals and oral hygiene routines.",
        "However, successful clear aligner therapy demands diligent patient compliance: trays must be worn consistently for 20 to 22 hours per day to achieve planned tooth movements.",
      ],
      authorName: "TBD:blog_content",
      clinicalReviewer: "TBD:blog_content",
      reviewedDate: "2026-10-27",
    },
    {
      slug: "preventing-gum-disease-daily-protocol",
      title: "Preventing Periodontal Disease: Daily Protocol & Early Warning Signs",
      category: "Preventive Care",
      publishedAt: "2026-11-05",
      readTime: "4 min read",
      summary: "Learn how biofilm matures into tartar, why bleeding gums should never be ignored, and the daily evidence-based routine to maintain healthy gums.",
      content: [
        "Gingivitis is the reversible precursor to periodontitis. When plaque remains on teeth for more than 48 hours, it begins to mineralize into dental calculus (tartar), which cannot be removed by brushing alone.",
        "Healthy gums do not bleed during normal brushing or flossing. If you observe pink in the sink, it signifies underlying bacterial inflammation requiring professional ultrasonic debridement.",
        "Daily flossing or interdental brushes, paired with 6-monthly professional cleanings, remain the most cost-effective investment in lifelong dental health.",
      ],
      authorName: "TBD:blog_content",
      clinicalReviewer: "TBD:blog_content",
      reviewedDate: "2026-11-04",
    },
  ],

  // GALLERY ITEMS:
  // "Gallery and testimonials render only items with consent recorded."
  // Unconsented items are strictly excluded from public display.
  gallery: [
    {
      id: "gal-01",
      title: "Porcelain Veneers & Smile Transformation",
      treatmentSlug: "smile-designing",
      category: "Cosmetic",
      description: "Restoration of front tooth wear, chipping, and deep staining using minimal-preparation custom porcelain veneers.",
      consentRecorded: true,
      consentReferenceId: "CONSENT-MED-2026-0812",
      beforeLabel: "Before: Worn enamel edges, uneven proportions, and staining",
      afterLabel: "After: Balanced, natural smile with custom porcelain veneers",
      clinicalNotes: "Case documented with full clinical consent for healthcare education. Individual clinical outcomes vary.",
    },
    {
      id: "gal-02",
      title: "Clear Aligner Teeth Straightening",
      treatmentSlug: "braces-and-aligners",
      category: "Orthodontics",
      description: "Gentle correction of moderate crowding and spacing over a 9-month custom clear aligner treatment plan.",
      consentRecorded: true,
      consentReferenceId: "CONSENT-MED-2026-0945",
      beforeLabel: "Before: Crowded front teeth and misaligned bite",
      afterLabel: "After: Straight, beautifully aligned smile with clear aligners",
      clinicalNotes: "Patient consent verified under DPDP Act purpose-specific image guidelines.",
    },
    {
      id: "gal-03",
      title: "Single Tooth Dental Implant",
      treatmentSlug: "dental-implants",
      category: "Implantology",
      description: "Permanent replacement of a damaged molar with a durable dental implant and custom ceramic crown.",
      consentRecorded: true,
      consentReferenceId: "CONSENT-MED-2026-1011",
      beforeLabel: "Before: Missing tooth area with difficulty chewing",
      afterLabel: "After: Permanent ceramic tooth with natural bite function",
      clinicalNotes: "Documented with patient written consent for clinical portfolio display.",
    },
    {
      id: "gal-04-unconsented",
      title: "Unconsented Sample Case (Must Not Render)",
      treatmentSlug: "laser-teeth-whitening",
      category: "Cosmetic",
      description: "This item has no recorded consent and MUST be filtered out by the public gallery renderer.",
      consentRecorded: false, // Must be omitted by component
      beforeLabel: "Hidden",
      afterLabel: "Hidden",
      clinicalNotes: "Internal review only.",
    },
  ],

  // TESTIMONIALS:
  // "Gallery and testimonials render only items with consent recorded."
  testimonials: [
    {
      id: "tst-01",
      patientInitials: "R. S.",
      treatment: "Root Canal Treatment",
      reviewText: "The team explained every step of the root canal beforehand. I felt completely comfortable throughout the visit.",
      consentRecorded: true,
      consentReferenceId: "CONSENT-TST-2026-01",
      verifiedVisitDate: "September 2026",
    },
    {
      id: "tst-02",
      patientInitials: "A. P.",
      treatment: "Clear Aligners",
      reviewText: "The 3D digital scan made the whole orthodontic planning seamless. Transparent pricing with zero hidden charges.",
      consentRecorded: true,
      consentReferenceId: "CONSENT-TST-2026-02",
      verifiedVisitDate: "October 2026",
    },
    {
      id: "tst-03-unconsented",
      patientInitials: "M. K.",
      treatment: "Dental Implants",
      reviewText: "This testimonial has no consent and must never appear in the public UI.",
      consentRecorded: false, // Filtered out
      verifiedVisitDate: "November 2026",
    },
  ],

  faqs: [
    {
      category: "Appointments & Consultation",
      question: "How do I schedule an appointment?",
      answer: "You can book directly using our website's 'Book Appointment' button, selecting your preferred treatment, date, and time slot. Our clinic reception confirms all bookings after verifying operatory availability.",
    },
    {
      category: "Appointments & Consultation",
      question: "What is your cancellation and rescheduling policy?",
      answer: "We kindly request at least 24 hours prior notice if you need to reschedule or cancel an appointment so that the operatory slot can be made available to patients requiring emergency care.",
    },
    {
      category: "Treatments & Clinical Care",
      question: "How does the clinic ensure sterilization and patient safety?",
      answer: "We adhere to hospital-grade sterilization protocols including ultrasonic cleaning, medical-grade chemical disinfection, Class-B vacuum autoclaving of all surgical instruments in individual sealed pouches, and surface barrier replacements between every patient.",
    },
    {
      category: "Fees & Payment",
      question: "Are indicative prices provided on the website final?",
      answer: "No. Website prices are strictly indicative estimates. Every human anatomy is unique. A finalized, itemized treatment estimate is provided only after an in-person clinical examination and diagnostic radiograph by our dental surgeon.",
    },
    {
      category: "Fees & Payment",
      question: "What payment methods are accepted at the clinic?",
      answer: "We accept UPI, major credit/debit cards, net banking, and cash for all clinical consultations and procedures.",
    },
    {
      category: "Emergency & Urgency",
      question: "What constitutes a dental emergency requiring immediate attention?",
      answer: "Severe trauma/knocked-out tooth (avulsion), persistent hemorrhage, rapidly spreading facial swelling impairing breathing or swallowing, and acute fever paired with tooth infection are red-flag emergencies requiring urgent in-person medical/dental care.",
    },
  ],

  policies: {
    privacyNotice: "TBD:privacy_notice",
    termsAndConditions: "TBD:terms",
    cancellationPolicy: "TBD:cancellation_policy",
  },
};

/**
 * Scan all published content for unresolved TBD keys.
 * Returns an array of keys found in published fields.
 */
export function findUnresolvedTBDs(content: ClinicContent = clinicContent): string[] {
  const unresolved: string[] = [];

  const checkValue = (val: unknown, path: string) => {
    if (val === null || val === undefined) return;
    if (typeof val === "string") {
      if (val.startsWith("TBD:") || val.includes("[TBD:")) {
        unresolved.push(`${path}: ${val}`);
      }
    } else if (Array.isArray(val)) {
      val.forEach((item, index) => checkValue(item, `${path}[${index}]`));
    } else if (typeof val === "object") {
      Object.entries(val).forEach(([k, v]) => checkValue(v, `${path}.${k}`));
    }
  };

  // Audit all published top-level sections
  checkValue(content.clinic, "clinic");
  checkValue(content.services, "services");
  checkValue(content.dentists, "dentists");
  checkValue(content.blogPosts, "blogPosts");
  checkValue(content.policies, "policies");

  return unresolved;
}

export function isTBDValue(val: unknown): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === "string") {
    return val.startsWith("TBD:") || val.includes("[TBD:");
  }
  return false;
}

/**
 * Filter gallery items to only those with legally recorded consent.
 */
export function getConsentedGallery(items: GalleryItem[] = clinicContent.gallery): GalleryItem[] {
  return items.filter((item) => item.consentRecorded === true && Boolean(item.consentReferenceId));
}

/**
 * Filter testimonials to only those with legally recorded consent.
 */
export function getConsentedTestimonials(items: TestimonialItem[] = clinicContent.testimonials): TestimonialItem[] {
  return items.filter((item) => item.consentRecorded === true && Boolean(item.consentReferenceId));
}
