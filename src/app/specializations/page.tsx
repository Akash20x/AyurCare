import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Award, CheckCircle, Heart, Leaf, Star } from "lucide-react";

const specializations = [
  {
    id: "panchakarma",
    name: "Panchakarma",
    icon: "🌿",
    description: "Comprehensive detoxification and rejuvenation therapy",
    benefits: [
      "Deep detoxification of body tissues",
      "Improved digestion and metabolism",
      "Enhanced immunity and vitality",
      "Stress relief and mental clarity",
    ],
    conditions: [
      "Chronic fatigue",
      "Digestive disorders",
      "Joint pain and arthritis",
      "Skin conditions",
    ],
  },
  {
    id: "rasayana",
    name: "Rasayana (Rejuvenation)",
    icon: "✨",
    description: "Anti-aging and longevity enhancement therapies",
    benefits: [
      "Cellular rejuvenation",
      "Enhanced longevity",
      "Improved cognitive function",
      "Increased energy levels",
    ],
    conditions: [
      "Premature aging",
      "Memory issues",
      "Low energy",
      "Hormonal imbalances",
    ],
  },
  {
    id: "stri-roga",
    name: "Stri Roga (Women's Health)",
    icon: "👩‍⚕️",
    description: "Comprehensive women's health and reproductive wellness",
    benefits: [
      "Hormonal balance",
      "Reproductive health",
      "Pregnancy support",
      "Menopausal care",
    ],
    conditions: [
      "PCOS/PCOD",
      "Irregular periods",
      "Fertility issues",
      "Menopause symptoms",
    ],
  },
  {
    id: "bal-roga",
    name: "Bal Roga (Pediatrics)",
    icon: "👶",
    description: "Natural healthcare for children using gentle Ayurvedic methods",
    benefits: [
      "Natural immunity building",
      "Safe, gentle treatments",
      "Holistic development",
      "Preventive care",
    ],
    conditions: [
      "Recurring infections",
      "Growth issues",
      "Digestive problems",
      "Behavioral concerns",
    ],
  },
  {
    id: "swasthavritta",
    name: "Swasthavritta (Preventive)",
    icon: "🛡️",
    description: "Preventive medicine and lifestyle management",
    benefits: [
      "Disease prevention",
      "Lifestyle optimization",
      "Stress management",
      "Enhanced wellbeing",
    ],
    conditions: [
      "Stress-related disorders",
      "Lifestyle diseases",
      "Preventive care",
      "Health optimization",
    ],
  },
  {
    id: "kayachikitsa",
    name: "Kayachikitsa (Internal Medicine)",
    icon: "🫀",
    description: "Treatment of internal diseases using Ayurvedic principles",
    benefits: [
      "Root cause treatment",
      "Natural healing",
      "Minimal side effects",
      "Holistic approach",
    ],
    conditions: [
      "Diabetes",
      "Hypertension",
      "Digestive disorders",
      "Chronic diseases",
    ],
  },
];

export default function SpecializationsPage() {
  return (
    <main className="py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-healing-green mb-6">
            Ayurvedic Specializations
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover the ancient wisdom of Ayurveda through specialized treatments
            tailored to your unique health needs and constitution.
          </p>
        </div>

        {/* Specializations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {specializations.map((spec) => (
            <Card
              key={spec.id}
              className="group hover:shadow-[var(--shadow-soft)] transition-all duration-300 border hover:border-healing-green/20"
            >
              <CardHeader>
                <div className="flex items-start space-x-4">
                  <div className="text-4xl">{spec.icon}</div>
                  <div className="flex-1">
                    <CardTitle className="text-xl text-healing-green group-hover:text-healing-green/80 transition-colors">
                      {spec.name}
                    </CardTitle>
                    <p className="text-muted-foreground mt-2">{spec.description}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Key Benefits */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center">
                    <Heart className="h-4 w-4 text-healing-green mr-2" />
                    Key Benefits
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {spec.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 text-healing-green" />
                        <span className="text-sm text-muted-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Common Conditions */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center">
                    <Leaf className="h-4 w-4 text-earth-brown mr-2" />
                    Treats Conditions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {spec.conditions.map((condition, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-earth-brown-light border-earth-brown/30 text-xs"
                      >
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Why Choose Ayurveda Section */}
        <div className="bg-healing-green-light rounded-2xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-healing-green mb-4">
              Why Choose Ayurvedic Medicine?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the benefits of 5000-year-old healing wisdom backed by modern research
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-healing-green rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-healing-green mb-2">Natural & Safe</h3>
              <p className="text-muted-foreground">
              {"Plant-based medicines with minimal side effects, working in harmony with your body's natural healing processes."}
            </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-earth-brown rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-white " />
              </div>
              <h3 className="text-xl font-semibold text-earth-brown mb-2">Proven Tradition</h3>
              <p className="text-muted-foreground">
                Time-tested treatments refined over millennia, now validated by modern scientific research and clinical studies.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gold-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-yellow-600 mb-2">Holistic Approach</h3>
              <p className="text-muted-foreground">
                Treats the root cause, not just symptoms, considering mind, body, and spirit for complete wellness.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
