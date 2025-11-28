import { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  BarChart3, 
  ArrowRight, 
  Sparkles,
  CheckCircle,
  Lightbulb
} from 'lucide-react';

const STEPS = [
  {
    icon: TrendingUp,
    title: 'Welcome to FinFlow',
    description: 'Your personal finance dashboard for tracking income, expenses, and debts across your entire household.',
    color: 'emerald',
  },
  {
    icon: Users,
    title: 'Family Profiles',
    description: 'Create profiles for each family member. Switch between individual views or see the combined "Family View" for household totals.',
    color: 'violet',
    tip: 'Click the + button next to the profile dropdown to add family members.',
  },
  {
    icon: CreditCard,
    title: 'Track Everything',
    description: 'Record income, fixed expenses, utilities, and debt payments. Use the Quick Add button (bottom-right) to add entries fast.',
    color: 'amber',
    tip: 'Categories can be customized in the Settings menu.',
  },
  {
    icon: BarChart3,
    title: 'Smart Insights',
    description: 'Get personalized suggestions on how to optimize your finances. See where your money goes with visual charts.',
    color: 'cyan',
    tip: 'The dashboard shows smart suggestions when you have a surplus.',
  },
  {
    icon: Sparkles,
    title: 'Monthly Workflow',
    description: 'Use "Start New Month" to carry over recurring expenses. Static items keep their values, variable items reset to ₪0.',
    color: 'coral',
    tip: 'This saves time by copying your regular bills automatically.',
  },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const isLastStep = step === STEPS.length - 1;
  const currentStep = STEPS[step];
  const Icon = currentStep.icon;

  const colorClasses = {
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/30',
    violet: 'from-violet-500 to-violet-600 shadow-violet-500/30',
    amber: 'from-amber-500 to-amber-600 shadow-amber-500/30',
    cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-500/30',
    coral: 'from-coral-500 to-coral-600 shadow-coral-500/30',
  };

  function handleNext() {
    if (isLastStep) {
      onComplete();
    } else {
      setStep(s => s + 1);
    }
  }

  function handleSkip() {
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/95 backdrop-blur-xl">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-emerald-500' : i < step ? 'w-2 bg-emerald-500/50' : 'w-2 bg-navy-600'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8 text-center animate-fade-in" key={step}>
          {/* Icon */}
          <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${colorClasses[currentStep.color]} shadow-lg flex items-center justify-center`}>
            <Icon className="w-10 h-10 text-white" />
          </div>

          {/* Content */}
          <h2 className="text-2xl font-bold text-white mb-3">{currentStep.title}</h2>
          <p className="text-navy-300 text-lg mb-6 leading-relaxed">{currentStep.description}</p>

          {/* Tip */}
          {currentStep.tip && (
            <div className="flex items-start gap-3 bg-navy-800/50 rounded-xl p-4 mb-6 text-left">
              <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-navy-300">{currentStep.tip}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-navy-400 hover:text-white transition-colors"
            >
              Skip tutorial
            </button>
            <button
              onClick={handleNext}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r ${colorClasses[currentStep.color]} text-white shadow-lg transition-all hover:scale-105`}
            >
              {isLastStep ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Get Started</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Features preview on first step */}
        {step === 0 && (
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { label: 'Track Expenses', icon: '📊' },
              { label: 'Family Budgets', icon: '👨‍👩‍👧' },
              { label: 'Debt Freedom', icon: '🎯' },
            ].map((feature, i) => (
              <div 
                key={i} 
                className="glass-light rounded-xl p-4 text-center animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="text-2xl mb-2">{feature.icon}</div>
                <p className="text-xs text-navy-300">{feature.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

