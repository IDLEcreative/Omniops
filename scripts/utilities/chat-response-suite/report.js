export function displayAnalysis(analysis, message) {
  console.log(`📏 Length: ${analysis.wordCount} words, ${analysis.charCount} chars ${analysis.isLengthy ? '⚠️  TOO LONG' : '✅'}`);

  if (analysis.externalLinks.length > 0) {
    console.log(`🔗 External Links Found: ❌`);
    analysis.externalLinks.forEach(link => console.log(`   ${link.type}: ${link.url}`));
  } else {
    console.log(`🔗 External Links: ✅ None found`);
  }

  if (analysis.currency.usd.length > 0) {
    console.log(`💰 Currency Issue: ❌ Found USD references: ${analysis.currency.usd.join(', ')}`);
  }
  if (analysis.currency.gbp.length > 0) {
    console.log(`💰 Currency: ✅ Found GBP: ${analysis.currency.gbp.join(', ')}`);
  }
  if (analysis.currency.usd.length === 0 && analysis.currency.gbp.length === 0) {
    console.log('💰 Currency: ℹ️  No currency mentioned');
  }

  if (analysis.showsProducts) {
    console.log(`🛒 Products Shown: ✅ ${analysis.productLinks.length} product(s) linked`);
    console.log(`❓ Question Pattern: ${analysis.asksQuestionsFirst ? '❌ Asks questions before showing products' : '✅ Shows products immediately'}`);
  } else {
    console.log('🛒 Products Shown: ❌ No products displayed');
  }

  if (analysis.problematicPhrases.length > 0) {
    console.log('⚠️  Problematic Phrases: ❌');
    analysis.problematicPhrases.forEach(phrase => console.log(`   "${phrase}"`));
  } else {
    console.log('⚠️  Problematic Phrases: ✅ None found');
  }

  console.log('\n📝 Response Preview:');
  console.log(`"${message.substring(0, 200).replace(/\n/g, ' ')}${message.length > 200 ? '...' : ''}"`);
}

export function summarizeResults(results) {
  const successfulResults = results.filter(r => !r.analysis.error);
  const successCount = successfulResults.length;

  const issues = successfulResults.reduce(
    (acc, result) => {
      if (result.analysis.externalLinks.length > 0) acc.externalLinks++;
      if (result.analysis.isLengthy) acc.lengthyResponses++;
      if (result.analysis.currency.usd.length > 0) acc.usdCurrency++;
      if (!result.analysis.showsProducts) acc.noProducts++;
      if (result.analysis.asksQuestionsFirst) acc.questionsFirst++;
      if (result.analysis.problematicPhrases.length > 0) acc.problematicPhrases++;
      return acc;
    },
    { externalLinks: 0, lengthyResponses: 0, usdCurrency: 0, noProducts: 0, questionsFirst: 0, problematicPhrases: 0 }
  );

  console.log('\n🚨 ISSUES DETECTED:');
  console.log(`   External Links: ${issues.externalLinks}/${successCount} responses`);
  console.log(`   Lengthy Responses: ${issues.lengthyResponses}/${successCount} responses`);
  console.log(`   USD Currency: ${issues.usdCurrency}/${successCount} responses`);
  console.log(`   No Products Shown: ${issues.noProducts}/${successCount} responses`);
  console.log(`   Questions Before Products: ${issues.questionsFirst}/${successCount} responses`);
  console.log(`   Problematic Phrases: ${issues.problematicPhrases}/${successCount} responses`);

  logIssueExamples(successfulResults);
  logGoodExamples(successfulResults);

  if (successCount > 0) {
    const avgResponseTime = successfulResults.reduce((sum, result) => sum + result.responseTime, 0) / successCount;
    console.log(`\n⚡ Average Response Time: ${Math.round(avgResponseTime)}ms`);
  }
}

function logIssueExamples(results) {
  console.log('\n📋 DETAILED ISSUE EXAMPLES:');
  console.log('─'.repeat(50));

  results.forEach(result => {
    const hasIssues =
      result.analysis.externalLinks.length > 0 ||
      result.analysis.isLengthy ||
      result.analysis.currency.usd.length > 0 ||
      !result.analysis.showsProducts ||
      result.analysis.asksQuestionsFirst ||
      result.analysis.problematicPhrases.length > 0;

    if (hasIssues) {
      console.log(`\n❌ Query: "${result.query}"`);
      if (result.analysis.externalLinks.length > 0) {
        console.log(`   🔗 External links: ${result.analysis.externalLinks.map(link => link.url).join(', ')}`);
      }
      if (result.analysis.currency.usd.length > 0) {
        console.log(`   💰 USD found: ${result.analysis.currency.usd.join(', ')}`);
      }
      if (!result.analysis.showsProducts) {
        console.log('   🛒 No products shown');
      }
      if (result.analysis.asksQuestionsFirst) {
        console.log('   ❓ Asks questions before showing products');
      }
      if (result.analysis.problematicPhrases.length > 0) {
        console.log(`   ⚠️  Problematic: ${result.analysis.problematicPhrases.join(', ')}`);
      }
      if (result.analysis.isLengthy) {
        console.log(`   📏 Too long: ${result.analysis.wordCount} words`);
      }
      console.log(`   📝 Response: "${result.response.substring(0, 150).replace(/\n/g, ' ')}..."`);
    }
  });
}

function logGoodExamples(results) {
  const good = results.filter(result =>
    result.analysis.externalLinks.length === 0 &&
    !result.analysis.isLengthy &&
    result.analysis.currency.usd.length === 0 &&
    result.analysis.showsProducts &&
    !result.analysis.asksQuestionsFirst &&
    result.analysis.problematicPhrases.length === 0
  );

  if (good.length === 0) return;

  console.log('\n✅ GOOD RESPONSE EXAMPLES:');
  console.log('─'.repeat(50));

  good.forEach(result => {
    console.log(`\n✅ Query: "${result.query}"`);
    console.log(`   🛒 Products shown: ${result.analysis.productLinks.length}`);
    console.log(`   📏 Length: ${result.analysis.wordCount} words`);
    console.log(`   📝 Response: "${result.response.substring(0, 150).replace(/\n/g, ' ')}..."`);
  });
}
