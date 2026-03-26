import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Sparkles, Heart, Coffee, MapPin, ShieldCheck, 
  Wand2, Zap, Check, Bot, Video, Shield, PartyPopper 
} from "lucide-react";

interface PricingTier {
  id: string;
  name: string;
  price: string;
  features: string[];
  gradient: string;
  is_popular: boolean;
}

interface FutureFeature {
  id: string;
  name: string;
  icon_name: string;
  color_theme: string;
}

export function LandingPage() {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [features, setFeatures] = useState<FutureFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLandingData() {
      try {
        setLoading(true);
        const [tiersResponse, featuresResponse] = await Promise.all([
          supabase.from('pricing_tiers').select('*').order('price_value', { ascending: true }),
          supabase.from('future_features').select('*')
        ]);

        if (tiersResponse.error) throw tiersResponse.error;
        if (featuresResponse.error) throw featuresResponse.error;

        setTiers(tiersResponse.data || []);
        setFeatures(featuresResponse.data || []);
      } catch (err) {
        console.error("Landing data error:", err);
        setErrorMessage("We hit a tiny snag while loading our latest plans. Please give the page a quick refresh!");
      } finally {
        setLoading(false);
      }
    }

    fetchLandingData();
  }, []);

  const getFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'robot': return <Bot className="mr-2.5 h-4 w-4 shrink-0" />;
      case 'video': return <Video className="mr-2.5 h-4 w-4 shrink-0" />;
      case 'shield-halved': return <Shield className="mr-2.5 h-4 w-4 shrink-0" />;
      case 'champagne-glasses': return <PartyPopper className="mr-2.5 h-4 w-4 shrink-0" />;
      default: return <Sparkles className="mr-2.5 h-4 w-4 shrink-0" />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="relative w-full max-w-7xl mx-auto px-4 py-10 md:py-20 mb-12 overflow-hidden">
        <div className="absolute top-0 -right-10 w-52 md:w-80 h-52 md:h-80 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-52 md:w-80 h-52 md:h-80 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-700" />
        
        <div className="grid lg:grid-cols-2 gap-10 items-center relative z-10">
          <div className="space-y-5 md:space-y-6 animate-in slide-in-from-bottom-8 duration-700 text-center lg:text-left">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-red-200 bg-red-50/50 backdrop-blur-sm text-[11px] md:text-xs font-bold text-red-600 mb-1">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-red-500" />
              The #1 Trusted Dating Platform
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold leading-tight tracking-tighter text-gray-900">
              Spark Real <br className="hidden md:block"/>
              <span className="bg-gradient-to-r from-red-600 via-rose-500 to-red-500 bg-clip-text text-transparent">
                Chemistry.
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-gray-500 leading-relaxed max-w-lg mx-auto lg:mx-0 font-medium">
              Skip the endless swiping. Connect with verified singles through shared passions, genuine conversations, and authentic moments.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link to="/signup" className="group relative inline-flex items-center justify-center bg-gradient-to-r from-red-600 via-rose-500 to-red-500 text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-sm md:text-base font-black shadow-[0_8px_25px_rgba(225,29,72,0.4)] hover:shadow-[0_12px_30px_rgba(225,29,72,0.6)] transition-all duration-300 transform hover:-translate-y-1">
                <span>Start Your Journey</span>
                <Heart className="w-4 h-4 ml-2.5 group-hover:scale-125 transition-transform duration-300 fill-current" />
              </Link>
              <a href="#how-it-works" className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 rounded-full text-sm md:text-base font-bold text-gray-700 bg-white border border-gray-100 shadow-sm hover:bg-gray-50 transition-all duration-300">
                How it works
              </a>
            </div>
          </div>

          <div className="relative h-[320px] md:h-[480px] hidden lg:block">
            <div className="absolute top-0 right-10 w-52 h-64 rounded-[2rem] overflow-hidden shadow-2xl animate-float z-20 cursor-pointer border-4 border-white">
              <div className="absolute inset-0 bg-gradient-to-t from-red-900/60 to-transparent z-10" />
              <img src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800" alt="Happy Couple" loading="lazy" className="w-full h-full object-cover" />
              <div className="absolute bottom-5 left-5 z-20 text-white font-bold text-base flex items-center">
                <Coffee className="w-4 h-4 mr-2 shrink-0" /> Coffee Lovers
              </div>
            </div>
            
            <div className="absolute bottom-8 left-0 w-48 h-56 rounded-[2rem] overflow-hidden shadow-2xl animate-float-slow z-30 cursor-pointer border-4 border-white">
              <div className="absolute inset-0 bg-gradient-to-t from-rose-900/60 to-transparent z-10" />
              <img src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=800" alt="Laughing Together" loading="lazy" className="w-full h-full object-cover" />
              <div className="absolute bottom-5 left-5 z-20 text-white font-bold text-base flex items-center">
                <MapPin className="w-4 h-4 mr-2 shrink-0" /> 2 miles away
              </div>
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full overflow-hidden shadow-xl hover:scale-110 transition-all duration-500 z-10 border-[6px] border-white/50 backdrop-blur-md">
              <img src="https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=800" alt="Holding Hands" loading="lazy" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mb-16 md:mb-24" id="how-it-works">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 md:mb-4">Why Choose <span className="text-red-600">TLC?</span></h2>
          <p className="text-gray-500 text-base md:text-lg font-medium">Designed for safety, built for real romance.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          <div className="group bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1.5 border border-red-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 md:w-24 md:h-24 bg-red-50 rounded-bl-[60px] md:rounded-bl-[80px] group-hover:bg-red-100 transition-colors" />
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl md:rounded-2xl shadow-lg flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform">
              <ShieldCheck className="text-white w-6 h-6 md:w-8 md:h-8" />
            </div>
            <h3 className="text-lg md:text-xl font-black mb-2 text-gray-800 relative z-10">Verified Identity</h3>
            <p className="text-gray-500 leading-relaxed font-medium relative z-10 text-xs md:text-sm">Our biometric face-matching ensures you only talk to real, authenticated people. No catfish allowed.</p>
          </div>

          <div className="group bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1.5 border border-rose-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 md:w-24 md:h-24 bg-rose-50 rounded-bl-[60px] md:rounded-bl-[80px] group-hover:bg-rose-100 transition-colors" />
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-rose-400 to-red-600 rounded-xl md:rounded-2xl shadow-lg flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform">
              <Wand2 className="text-white w-6 h-6 md:w-8 md:h-8" />
            </div>
            <h3 className="text-lg md:text-xl font-black mb-2 text-gray-800 relative z-10">Soulmate Engine</h3>
            <p className="text-gray-500 leading-relaxed font-medium relative z-10 text-xs md:text-sm">We connect you based on core values, life goals, and daily habits, not just a profile picture.</p>
          </div>

          <div className="group bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1.5 border border-red-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 md:w-24 md:h-24 bg-red-50 rounded-bl-[60px] md:rounded-bl-[80px] group-hover:bg-red-100 transition-colors" />
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-xl md:rounded-2xl shadow-lg flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform">
              <Zap className="text-white w-6 h-6 md:w-8 md:h-8" />
            </div>
            <h3 className="text-lg md:text-xl font-black mb-2 text-gray-800 relative z-10">Smart Pulse</h3>
            <p className="text-gray-500 leading-relaxed font-medium relative z-10 text-xs md:text-sm">Discover active connections nearby with real-time location accuracy and interest-based radar.</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-50/50 to-rose-50/50 py-12 md:py-20 rounded-[1.5rem] md:rounded-[3rem] max-w-7xl mx-auto px-4 mb-16 md:mb-24 border border-white shadow-xl mx-2 md:mx-auto">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 md:mb-4">Upgrade Your <span className="text-red-600">Love Life</span></h2>
          <p className="text-gray-500 text-base md:text-lg font-medium">Unlock exclusive features to find your person faster.</p>
        </div>
        
        {errorMessage ? (
          <div className="max-w-xl mx-auto">
            <Alert variant="destructive">
              <AlertTitle>Hang tight!</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </div>
        ) : loading ? (
           <div className="flex flex-col items-center justify-center space-y-3 animate-pulse">
             <div className="w-10 h-10 rounded-full bg-red-200"></div>
             <div className="text-red-500 text-sm font-bold">Gathering our best plans for you...</div>
           </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 md:mb-24">
              {tiers.map((tier) => (
                <div key={tier.id} className={`relative bg-white/70 backdrop-blur-md border border-white/50 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] transition-all duration-500 hover:-translate-y-1.5 group ${
                    tier.is_popular ? 'ring-[3px] ring-red-500 shadow-2xl md:scale-105 z-20 bg-white/95 mt-4 md:mt-0' : 'shadow-lg'
                  }`}>
                  
                  {tier.is_popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-600 to-rose-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl whitespace-nowrap">
                      Best Match
                    </div>
                  )}

                  <h3 className="text-lg md:text-xl font-black text-gray-800">{tier.name}</h3>
                  <div className="my-5 md:my-6">
                    <span className="text-3xl md:text-4xl font-black tracking-tighter text-gray-900">{tier.price}</span>
                    <span className="text-gray-400 font-bold text-xs md:text-sm">/mo</span>
                  </div>
                  
                  <ul className="space-y-3 md:space-y-4 text-gray-600 mb-6 md:mb-8">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center font-bold text-[11px] md:text-xs">
                        <Check className="w-3.5 h-3.5 text-red-500 mr-2.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <button className={`w-full py-2.5 md:py-3 rounded-xl font-black transition-all duration-300 text-white shadow-lg bg-gradient-to-r ${tier.gradient} hover:scale-105 active:scale-95 text-xs md:text-sm`}>
                    Join Now
                  </button>
                </div>
              ))}
            </div>

            <div className="max-w-4xl mx-auto text-center px-4">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-6 md:mb-10">The Future of Dating</h2>
              <div className="flex flex-wrap justify-center gap-3 md:gap-5">
                {features.map((f) => (
                  <div key={f.id} className={`group px-5 py-2.5 md:px-6 md:py-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-${f.color_theme}-200 transition-all cursor-default hover:-translate-y-1`}>
                    <span className={`font-bold text-${f.color_theme}-600 flex items-center text-xs md:text-sm`}>
                      {getFeatureIcon(f.icon_name)} {f.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}