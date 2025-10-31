import { Eye, Activity, FileText, Shield, AlertTriangle, BarChart3 } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: Activity,
      title: 'Advanced Detection Technology',
      description: 'Utilize cutting-edge AI algorithms to analyze body movements, eye tracking, and behavioral patterns in real-time. Our system detects suspicious activities with 99.2% accuracy.',
      highlights: ['Body movement analysis', 'Eye tracking technology', 'Behavioral pattern recognition', 'Multi-factor authentication']
    },
    {
      icon: Eye,
      title: 'Real-time Monitoring Dashboard',
      description: 'Monitor all exam sessions simultaneously with our intuitive dashboard. Track live feeds, receive instant alerts, and manage multiple exams from a single interface.',
      highlights: ['Live video feeds', 'Instant alert notifications', 'Multi-exam management', 'Customizable monitoring views']
    },
    {
      icon: FileText,
      title: 'Comprehensive Reporting Tools',
      description: 'Generate detailed reports with timestamps, incident recordings, and analytics. Export data for compliance, review flagged events, and maintain audit trails.',
      highlights: ['Automated report generation', 'Incident timestamps & recordings', 'Export to multiple formats', 'Historical data analytics']
    }
  ];

  const stats = [
    { icon: Shield, value: '99.2%', label: 'Detection Accuracy' },
    { icon: AlertTriangle, value: '< 0.5s', label: 'Alert Response Time' },
    { icon: BarChart3, value: '500K+', label: 'Exams Monitored' }
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Powerful Features for Exam Integrity
          </h2>
          <p className="text-xl text-[#c9d1d9] max-w-2xl mx-auto">
            Everything you need to ensure fair and secure online examinations
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
            >
              <stat.icon className="w-12 h-12 text-[#3b82f6] mx-auto mb-4" />
              <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-[#c9d1d9]">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 sm:p-12 hover:bg-white/10 transition-all duration-300 transform hover:scale-[1.02]"
            >
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-[#3b82f6]/20 rounded-2xl flex items-center justify-center">
                    <feature.icon className="w-8 h-8 text-[#3b82f6]" />
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <h3 className="text-3xl font-bold text-white">{feature.title}</h3>
                  <p className="text-lg text-[#c9d1d9] leading-relaxed">
                    {feature.description}
                  </p>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                    {feature.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-[#c9d1d9]">
                        <div className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full"></div>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
