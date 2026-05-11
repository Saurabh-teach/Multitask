import React from 'react';
import { Link } from 'react-router-dom';
import { Target, ListTodo, Users, ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="glass-nav px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Target size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-gray-900 brand-font">GoalFlow</span>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/login" className="font-medium text-gray-600 hover:text-blue-600 transition-colors">Login</Link>
          <Link to="/register" className="btn-primary">
            Start Free <ArrowRight size={18} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.blue.50),white)]" />
        
        <div className="max-w-7xl mx-auto px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-8 animate-fade-in">
            <Zap size={14} className="fill-blue-700" />
            <span>Introducing Sprint Mode for Teams</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 leading-[1.1] mb-8 animate-fade-in tracking-tight brand-font">
            Execute your strategy <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">without the chaos</span>
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            The all-in-one platform for goal tracking, task execution, and team alignment. Build momentum and hit your targets faster.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Link to="/register" className="btn-primary text-lg px-10 py-4">
              Get Started for Free <ArrowRight size={20} />
            </Link>
            <button className="btn-secondary text-lg px-10 py-4">
              Watch Demo
            </button>
          </div>

          {/* Trusted By */}
          <div className="mt-24 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-8">Trusted by fast-growing teams</p>
            <div className="flex flex-wrap justify-center items-center gap-12 grayscale opacity-50">
              <span className="text-2xl font-bold italic">VOYAGER</span>
              <span className="text-2xl font-bold">lumina</span>
              <span className="text-2xl font-bold">VERTEX</span>
              <span className="text-2xl font-bold italic tracking-tighter">NEXUS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 brand-font">Everything you need to ship</h2>
            <p className="text-gray-600 max-w-xl mx-auto">No more spreadsheets or disconnected tools. GoalFlow brings your strategy and execution together.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-premium group hover:bg-blue-600 hover:text-white transition-all duration-500">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:text-white transition-colors">
                <Target size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-4 brand-font">Strategic Goals</h3>
              <p className="text-gray-600 group-hover:text-blue-50/80">Set high-level goals and track progress automatically based on linked tasks.</p>
            </div>

            <div className="card-premium group hover:bg-indigo-600 hover:text-white transition-all duration-500">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:text-white transition-colors">
                <ListTodo size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-4 brand-font">Sprint Execution</h3>
              <p className="text-gray-600 group-hover:text-indigo-50/80">Powerful task management with multiple assignees, statuses, and real-time updates.</p>
            </div>

            <div className="card-premium group hover:bg-emerald-600 hover:text-white transition-all duration-500">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-white/20 group-hover:text-white transition-colors">
                <Users size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-4 brand-font">Team Members</h3>
              <p className="text-gray-600 group-hover:text-emerald-50/80">Manage your entire team, assign roles, and see exactly who is working on what.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center gap-20">
          <div className="flex-1">
            <h2 className="text-4xl font-bold text-gray-900 mb-8 leading-tight brand-font">Built for the way <br />modern teams work</h2>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="mt-1 text-blue-600 bg-blue-50 p-1 rounded-full"><CheckCircle2 size={20} /></div>
                <div>
                  <p className="font-bold text-gray-900">Real-time collaboration</p>
                  <p className="text-gray-600 text-sm">See changes instantly across your entire organization.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 text-blue-600 bg-blue-50 p-1 rounded-full"><ShieldCheck size={20} /></div>
                <div>
                  <p className="font-bold text-gray-900">Enterprise-grade security</p>
                  <p className="text-gray-600 text-sm">Your data is encrypted and protected with industry best practices.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 text-blue-600 bg-blue-50 p-1 rounded-full"><Zap size={20} /></div>
                <div>
                  <p className="font-bold text-gray-900">Instant setup</p>
                  <p className="text-gray-600 text-sm">Get started in minutes with our intuitive onboarding flow.</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2.5rem] p-10 border border-blue-100 shadow-2xl relative">
             <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-xl">98%</div>
             <blockquote className="text-2xl font-medium text-gray-800 mb-8 italic">
              "GoalFlow has completely changed how we track our quarterly OKRs. It's the most intuitive tool we've ever used."
             </blockquote>
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-gray-300 rounded-full" />
               <div>
                 <p className="font-bold text-gray-900">Alex Rivers</p>
                 <p className="text-gray-500 text-sm">CTO, Lumina Systems</p>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <Target size={24} />
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight brand-font">GoalFlow</span>
          </div>
          
          <div className="flex gap-10 text-sm text-gray-500 font-medium">
            <Link to="#" className="hover:text-blue-600">Privacy Policy</Link>
            <Link to="#" className="hover:text-blue-600">Terms of Service</Link>
            <Link to="#" className="hover:text-blue-600">Contact Us</Link>
          </div>

          <p className="text-sm text-gray-400 font-medium italic">© 2026 GoalFlow Inc. Built for progress.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;