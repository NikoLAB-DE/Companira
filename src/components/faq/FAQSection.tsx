import React from 'react';
import FAQItem from './FAQItem';
import { faqData } from '@/data/faqData';

const FAQSection: React.FC = () => {
  return (
    // Use background for better contrast, increased padding
    <section className="py-16 bg-background rounded-lg" aria-labelledby="faq-heading">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          id="faq-heading"
          // Use a prominent color, larger text, more bottom margin
          className="text-3xl font-bold text-center mb-12 text-foreground"
        >
          Frequently Asked Questions
        </h2>

        {/* Remove default divide-y, add spacing between items */}
        <div className="space-y-4">
          {faqData.map((item, index) => (
            <FAQItem key={index} item={item} index={index} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Still have questions?{' '}
            <a href="#" className="font-medium text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded">
              Contact us
            </a> for more information.
          </p>
        </div>

        {/* Keep FAQ Schema for SEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqData.map(item => ({
              "@type": "Question",
              "name": item.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
              }
            }))
          })
        }} />
      </div>
    </section>
  );
};

export default FAQSection;
