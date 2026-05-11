import React from 'react';
import Sidebar from '../components/layout/Sidebar';
import { HelpCircle, BookOpen, MessageSquare, ShieldCheck, Zap } from 'lucide-react';

const HelpCenter = () => {
    const faqs = [
        {
            title: "How do I create a Goal?",
            content: "Navigate to the 'All Goals' page and click the 'New Goal' button. Fill in the title, description, and status to get started."
        },
        {
            title: "What are Strategic Initiatives?",
            content: "These are goals you've personally created. You can track them under the 'My Work' dashboard in the 'My Created Goals' tab."
        },
        {
            title: "How do I restore a deleted task?",
            content: "Go to the 'Trash Bin' in the sidebar, find your task, and click the 'Restore' button."
        },
        {
            title: "Who can manage the team?",
            content: "Only users with the 'Owner' or 'Admin' role can invite new members or manage the global talent pool."
        }
    ];

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
            <Sidebar />
            <div className="flex-1 ml-72 overflow-y-auto">
                <div className="px-10 py-10 max-w-5xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <HelpCircle size={32} />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900">How can we help?</h1>
                        <p className="text-gray-500 max-w-xl mx-auto text-lg">Search our documentation or browse common questions to get the most out of GoalFlow.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <BookOpen className="text-blue-500 mb-4" size={24} />
                            <h3 className="font-bold text-gray-900 mb-2">User Documentation</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">Comprehensive guides on every feature, from task management to strategic planning.</p>
                        </div>
                        <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <Zap className="text-amber-500 mb-4" size={24} />
                            <h3 className="font-bold text-gray-900 mb-2">Quick Start Guide</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">Get up and running with your first organization in less than 5 minutes.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 px-2">Frequently Asked Questions</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {faqs.map((faq, index) => (
                                <div key={index} className="p-6 bg-white rounded-2xl border border-gray-50 shadow-sm">
                                    <h4 className="font-bold text-gray-800 mb-2">{faq.title}</h4>
                                    <p className="text-sm text-gray-500 leading-relaxed">{faq.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <h3 className="text-2xl font-bold mb-2">Still have questions?</h3>
                            <p className="text-blue-100">Our support team is always here to help you succeed.</p>
                        </div>
                        <button className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-xl shadow-blue-900/20">
                            <MessageSquare size={20} /> Contact Support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpCenter;
