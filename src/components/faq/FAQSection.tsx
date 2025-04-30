import React from 'react';
import FAQItem from './FAQItem';
import { faqData } from '@/data/faqData';
import { Link } from 'react-router-dom'; // Import Link

const FAQSection: React.FC = () => {
  return (
    // Reduced padding
    <section className="py-12 bg-background rounded-lg" aria-labelledby="faq-heading"> {/* Reduced py-16 to py-12 */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          id="faq-heading"
          // Reduced font size and bottom margin
          className="text-2xl font-bold text-center mb-8 text-foreground" // Reduced text-3xl to text-2xl, mb-12 to mb-8
        >
          Frequently Asked Questions
        </h2>

        {/* Reduced spacing between items */}
        <div className="space-y-3"> {/* Reduced space-y-4 to space-y-3 */}
          {faqData.map((item, index) => (
            <FAQItem key={index} item={item} index={index} />
          ))}
        </div>

        {/* Reduced top margin */}
        <div className="mt-8 text-center"> {/* Reduced mt-12 to mt-8 */}
          <p className="text-sm text-muted-foreground"> {/* Added text-sm */}
            Still have questions?{' '}
            {/* Updated Link to include hash */}
            <Link to="/about#contact-form" className="font-medium text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded">
              Contact us
            </Link> for more information.
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
