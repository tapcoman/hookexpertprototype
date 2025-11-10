// Usage Analysis Script
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  users,
  hookGenerations,
  hookFormulas,
  hookPerformanceAnalytics,
  hookTrendTracking,
  favoriteHooks,
  psychologicalProfiles
} from './server/db/schema.js';
import { eq, gte, sql, desc, count, avg, sum } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_mZk4zWGy5JBh@ep-still-scene-abupgp6j-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

async function analyzeUsage() {
  console.log('🔍 Hook Line Studio - Usage Analysis\n');
  console.log('=' .repeat(80));

  try {
    // 1. User Statistics
    console.log('\n📊 USER STATISTICS');
    console.log('-'.repeat(80));

    const userStats = await db.select({
      total: count(),
      premium: sql`count(*) filter (where ${users.isPremium} = true)`,
      free: sql`count(*) filter (where ${users.isPremium} = false)`,
      verified: sql`count(*) filter (where ${users.emailVerified} = true)`,
    }).from(users);

    const subscriptionDist = await db.select({
      plan: users.subscriptionPlan,
      count: count()
    })
    .from(users)
    .groupBy(users.subscriptionPlan)
    .orderBy(desc(count()));

    console.log(`Total Users: ${userStats[0].total}`);
    console.log(`Premium Users: ${userStats[0].premium} (${((userStats[0].premium / userStats[0].total) * 100).toFixed(1)}%)`);
    console.log(`Free Users: ${userStats[0].free} (${((userStats[0].free / userStats[0].total) * 100).toFixed(1)}%)`);
    console.log(`Email Verified: ${userStats[0].verified} (${((userStats[0].verified / userStats[0].total) * 100).toFixed(1)}%)`);
    console.log('\nSubscription Distribution:');
    subscriptionDist.forEach(({ plan, count }) => {
      console.log(`  ${plan}: ${count} users`);
    });

    // 2. Hook Generation Statistics
    console.log('\n\n🎣 HOOK GENERATION STATISTICS');
    console.log('-'.repeat(80));

    const genStats = await db.select({
      total: count(),
      last30Days: sql`count(*) filter (where ${hookGenerations.createdAt} >= NOW() - INTERVAL '30 days')`,
      last7Days: sql`count(*) filter (where ${hookGenerations.createdAt} >= NOW() - INTERVAL '7 days')`,
    }).from(hookGenerations);

    const modelUsage = await db.select({
      model: hookGenerations.modelType,
      count: count(),
      avgConfidence: avg(hookGenerations.confidenceScore)
    })
    .from(hookGenerations)
    .groupBy(hookGenerations.modelType)
    .orderBy(desc(count()));

    const platformDist = await db.select({
      platform: hookGenerations.platform,
      count: count()
    })
    .from(hookGenerations)
    .groupBy(hookGenerations.platform)
    .orderBy(desc(count()));

    const objectiveDist = await db.select({
      objective: hookGenerations.objective,
      count: count()
    })
    .from(hookGenerations)
    .groupBy(hookGenerations.objective)
    .orderBy(desc(count()));

    console.log(`Total Generations: ${genStats[0].total}`);
    console.log(`Last 30 Days: ${genStats[0].last30Days}`);
    console.log(`Last 7 Days: ${genStats[0].last7Days}`);

    console.log('\nModel Usage:');
    modelUsage.forEach(({ model, count, avgConfidence }) => {
      const pct = ((count / genStats[0].total) * 100).toFixed(1);
      const confidence = avgConfidence ? Number(avgConfidence).toFixed(2) : 'N/A';
      console.log(`  ${model || 'Unknown'}: ${count} (${pct}%) - Avg Confidence: ${confidence}`);
    });

    console.log('\nPlatform Distribution:');
    platformDist.forEach(({ platform, count }) => {
      const pct = ((count / genStats[0].total) * 100).toFixed(1);
      console.log(`  ${platform}: ${count} (${pct}%)`);
    });

    console.log('\nObjective Distribution:');
    objectiveDist.forEach(({ objective, count }) => {
      const pct = ((count / genStats[0].total) * 100).toFixed(1);
      console.log(`  ${objective}: ${count} (${pct}%)`);
    });

    // 3. Formula Usage & Performance
    console.log('\n\n📈 FORMULA PERFORMANCE');
    console.log('-'.repeat(80));

    const formulaUsage = await db.select({
      code: hookFormulas.code,
      name: hookFormulas.name,
      category: hookFormulas.category,
      effectiveness: hookFormulas.effectivenessRating,
      riskFactor: hookFormulas.riskFactor,
      fatigueResistance: hookFormulas.fatigueResistance
    })
    .from(hookFormulas)
    .where(eq(hookFormulas.isActive, true))
    .orderBy(desc(hookFormulas.effectivenessRating))
    .limit(10);

    console.log('Top 10 Most Effective Formulas:');
    formulaUsage.forEach(({ code, name, category, effectiveness, riskFactor, fatigueResistance }) => {
      console.log(`  ${code} - ${name}`);
      console.log(`    Category: ${category} | Effectiveness: ${effectiveness}% | Risk: ${riskFactor} | Fatigue: ${fatigueResistance}%`);
    });

    // 4. Trend Tracking
    console.log('\n\n📉 HOOK FATIGUE TRACKING');
    console.log('-'.repeat(80));

    const trendData = await db.select({
      code: hookTrendTracking.formulaCode,
      platform: hookTrendTracking.platform,
      weeklyUsage: hookTrendTracking.weeklyUsage,
      monthlyUsage: hookTrendTracking.monthlyUsage,
      fatigueLevel: hookTrendTracking.fatigueLevel,
      trendDirection: hookTrendTracking.trendDirection,
      recommendationStatus: hookTrendTracking.recommendationStatus
    })
    .from(hookTrendTracking)
    .orderBy(desc(hookTrendTracking.fatigueLevel))
    .limit(10);

    if (trendData.length > 0) {
      console.log('Top 10 Fatigued Formulas:');
      trendData.forEach(({ code, platform, weeklyUsage, monthlyUsage, fatigueLevel, trendDirection, recommendationStatus }) => {
        console.log(`  ${code} (${platform})`);
        console.log(`    Weekly: ${weeklyUsage} | Monthly: ${monthlyUsage} | Fatigue: ${fatigueLevel}% | Trend: ${trendDirection} | Status: ${recommendationStatus}`);
      });
    } else {
      console.log('No trend tracking data available yet.');
    }

    // 5. Favorites & Engagement
    console.log('\n\n⭐ USER ENGAGEMENT');
    console.log('-'.repeat(80));

    const favoriteStats = await db.select({
      total: count()
    }).from(favoriteHooks);

    const favoritedFormulas = await db.select({
      framework: favoriteHooks.framework,
      count: count()
    })
    .from(favoriteHooks)
    .groupBy(favoriteHooks.framework)
    .orderBy(desc(count()))
    .limit(10);

    console.log(`Total Favorited Hooks: ${favoriteStats[0].total}`);

    if (genStats[0].total > 0) {
      const favoriteRate = ((favoriteStats[0].total / genStats[0].total) * 100).toFixed(1);
      console.log(`Favorite Rate: ${favoriteRate}%`);
    }

    if (favoritedFormulas.length > 0) {
      console.log('\nMost Favorited Formulas:');
      favoritedFormulas.forEach(({ framework, count }) => {
        console.log(`  ${framework}: ${count} favorites`);
      });
    }

    // 6. Psychological Profiles
    console.log('\n\n🧠 PSYCHOLOGICAL PROFILES');
    console.log('-'.repeat(80));

    const profileStats = await db.select({
      total: count(),
      avgCompleteness: avg(psychologicalProfiles.profileCompleteness),
      avgLearningRate: avg(psychologicalProfiles.learningRate)
    }).from(psychologicalProfiles);

    const riskTolerance = await db.select({
      risk: psychologicalProfiles.riskTolerance,
      count: count()
    })
    .from(psychologicalProfiles)
    .groupBy(psychologicalProfiles.riskTolerance)
    .orderBy(desc(count()));

    const creativityDist = await db.select({
      creativity: psychologicalProfiles.creativityLevel,
      count: count()
    })
    .from(psychologicalProfiles)
    .groupBy(psychologicalProfiles.creativityLevel)
    .orderBy(desc(count()));

    console.log(`Total Profiles: ${profileStats[0].total}`);
    if (profileStats[0].avgCompleteness) {
      console.log(`Avg Profile Completeness: ${Number(profileStats[0].avgCompleteness).toFixed(1)}%`);
    }
    if (profileStats[0].avgLearningRate) {
      console.log(`Avg Learning Rate: ${Number(profileStats[0].avgLearningRate).toFixed(1)}`);
    }

    if (riskTolerance.length > 0) {
      console.log('\nRisk Tolerance Distribution:');
      riskTolerance.forEach(({ risk, count }) => {
        console.log(`  ${risk}: ${count} users`);
      });
    }

    if (creativityDist.length > 0) {
      console.log('\nCreativity Level Distribution:');
      creativityDist.forEach(({ creativity, count }) => {
        console.log(`  ${creativity}: ${count} users`);
      });
    }

    // 7. Performance Analytics (if data exists)
    console.log('\n\n📊 PERFORMANCE ANALYTICS');
    console.log('-'.repeat(80));

    const analyticsStats = await db.select({
      total: count(),
      avgRating: avg(hookPerformanceAnalytics.userRating),
      usedCount: sql`count(*) filter (where ${hookPerformanceAnalytics.wasUsed} = true)`,
      favoritedCount: sql`count(*) filter (where ${hookPerformanceAnalytics.wasFavorited} = true)`
    }).from(hookPerformanceAnalytics);

    if (analyticsStats[0].total > 0) {
      console.log(`Total Performance Records: ${analyticsStats[0].total}`);
      if (analyticsStats[0].avgRating) {
        console.log(`Average User Rating: ${Number(analyticsStats[0].avgRating).toFixed(2)}/5`);
      }
      console.log(`Hooks Actually Used: ${analyticsStats[0].usedCount} (${((analyticsStats[0].usedCount / analyticsStats[0].total) * 100).toFixed(1)}%)`);
      console.log(`Hooks Favorited: ${analyticsStats[0].favoritedCount} (${((analyticsStats[0].favoritedCount / analyticsStats[0].total) * 100).toFixed(1)}%)`);
    } else {
      console.log('No performance analytics data available yet.');
    }

    // 8. Cost Estimation
    console.log('\n\n💰 ESTIMATED AI COSTS');
    console.log('-'.repeat(80));

    const COST_PER_GEN = {
      'gpt-5-2025-08-07': 3.80,
      'gpt-5-mini-2025-08-07': 0.19,
      'gpt-4o': 3.80, // Legacy mapping
      'gpt-4o-mini': 0.19 // Legacy mapping
    };

    let totalEstimatedCost = 0;
    console.log('Estimated Costs by Model:');
    for (const { model, count } of modelUsage) {
      const modelName = model || 'unknown';
      const costPerGen = COST_PER_GEN[modelName] || 2.0; // Default estimate
      const totalCost = count * costPerGen;
      totalEstimatedCost += totalCost;
      console.log(`  ${modelName}: ${count} gens × $${costPerGen.toFixed(2)} = $${totalCost.toFixed(2)}`);
    }
    console.log(`\nTotal Estimated Cost (All Time): $${totalEstimatedCost.toFixed(2)}`);

    if (genStats[0].last30Days > 0) {
      const monthlyCost = (totalEstimatedCost / genStats[0].total) * genStats[0].last30Days;
      console.log(`Estimated Monthly Cost (last 30 days): $${monthlyCost.toFixed(2)}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Analysis Complete!\n');

  } catch (error) {
    console.error('❌ Error during analysis:', error);
    throw error;
  } finally {
    await client.end();
  }
}

analyzeUsage().catch(console.error);
