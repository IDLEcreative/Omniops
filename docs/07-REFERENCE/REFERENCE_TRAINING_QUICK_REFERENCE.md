# Bot Training Quick Reference

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 7 minutes

## Purpose
http://localhost:3000/dashboard/training

## Quick Links
- [🚀 Quick Start](#-quick-start)
- [📊 Training Data Types](#-training-data-types)
- [🔥 Pro Tips](#-pro-tips)
- [⚡ API Quick Reference](#-api-quick-reference)
- [🎯 Training Strategy](#-training-strategy)

## Keywords
avoid, common, data, metrics, mistakes, need, quick, reference, start, strategy

---


## 🚀 Quick Start

### 1. Access Training
```
http://localhost:3000/dashboard/training
```

### 2. Add Your First Training Data

#### Option A: Scrape Your Website
```
1. Click "Website" tab
2. Enter: https://yoursite.com
3. Click "Scrape"
```

#### Option B: Add Q&A
```
1. Click "Q&A" tab
2. Enter common question
3. Provide perfect answer
4. Click "Add Q&A"
```

## 📊 Training Data Types

| Type | Best For | Example |
|------|----------|---------|
| **Website** | Full site content | Company website, docs |
| **Files** | Documents | PDFs, product catalogs |
| **Q&A** | Specific answers | FAQs, policies |
| **Text** | Custom content | Product descriptions |

## 🔥 Pro Tips

### High-Impact Q&A Examples
```
Q: What are your hours?
A: We're open Mon-Fri 9AM-6PM EST, Sat 10AM-4PM EST. Closed Sundays.

Q: How do I return an item?
A: Email returns@company.com with your order number. We'll send a prepaid label. Returns accepted within 30 days.

Q: Do you offer discounts?
A: Yes! New customers get 15% off with code WELCOME15. We also have seasonal sales and a loyalty program.
```

### Content Priorities
1. **Must Have**: Business hours, contact info, return policy
2. **Should Have**: Product details, shipping info, FAQs
3. **Nice to Have**: Company story, team bios, blog posts

## ⚡ API Quick Reference

### Add Q&A Pair
```bash
curl -X POST http://localhost:3000/api/training/qa \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is your refund policy?",
    "answer": "Full refund within 30 days, no questions asked."
  }'
```

### Add Custom Text
```bash
curl -X POST http://localhost:3000/api/training/text \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "We are a sustainable fashion brand founded in 2020..."
  }'
```

### List Training Data
```bash
curl http://localhost:3000/api/training \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎯 Training Strategy

### Week 1: Foundation
- [ ] Scrape main website
- [ ] Add top 10 FAQs
- [ ] Upload product catalog
- [ ] Add return/shipping policies

### Week 2: Refinement
- [ ] Add 20 more Q&As based on support tickets
- [ ] Upload any PDF guides/manuals
- [ ] Add seasonal/promotional content
- [ ] Test and refine responses

### Ongoing: Maintenance
- [ ] Weekly: Add new Q&As from customer queries
- [ ] Monthly: Update policies and pricing
- [ ] Quarterly: Full content review

## ⚠️ Common Mistakes to Avoid

❌ **Don't**: Add conflicting information
✅ **Do**: Remove old content before adding updates

❌ **Don't**: Use technical jargon
✅ **Do**: Write in customer-friendly language

❌ **Don't**: Add sensitive data (passwords, internal docs)
✅ **Do**: Only add public-facing information

❌ **Don't**: Forget to update seasonal content
✅ **Do**: Set reminders for time-sensitive updates

## 📈 Success Metrics

Track these to measure training effectiveness:
- **Response Accuracy**: Are answers correct?
- **Customer Satisfaction**: Are users happy?
- **Containment Rate**: How many queries are resolved?
- **Fallback Rate**: How often does bot say "I don't know"?

## 🆘 Need Help?

- **Training not working?** Check API keys in `.env.local`
- **Slow responses?** Reduce training data volume
- **Wrong answers?** Review and update training content
- **Missing features?** Check the full guide: `BOT_TRAINING_GUIDE.md`

---

💡 **Remember**: Quality > Quantity. Better to have 50 perfect Q&As than 500 mediocre ones!
