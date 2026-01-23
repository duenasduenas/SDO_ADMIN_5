import mongoose from "mongoose";
import Category from "../../models/Category.js";
import Folder from "../../models/Folder.js";

export async function ragSummary(req, res) {
  try {
    const { period, records } = req.body;

    // 🔴 VALIDATION
    if (!period || !Array.isArray(records)) {
      return res.status(400).json({
        message: "Invalid request body",
        received: { period, records }
      });
    }

    if (records.length === 0) {
      return res.status(200).json({
        summary: "No records found for this period.",
        details: null
      });
    }

    const total = records.length;

    // 🔹 Fetch all categories and folders to map _id → name
    const categoriesData = await Category.find({});
    const categoryMap = {};
    categoriesData.forEach(c => categoryMap[c._id] = c.name);

    const foldersData = await Folder.find({});
    const folderMap = {};
    foldersData.forEach(f => folderMap[f._id] = f.name);

    // 🔹 Category breakdown with percentages and daily tracking
    const categoriesCount = {};
    const categoryDailyBreakdown = {};

    records.forEach(r => {
      if (r.category) {
        const name = categoryMap[r.category] || r.category;
        const date = r.date ? new Date(r.date) : new Date();
        const dayKey = date.toISOString().split("T")[0];

        categoriesCount[name] = (categoriesCount[name] || 0) + 1;

        if (!categoryDailyBreakdown[name]) {
          categoryDailyBreakdown[name] = {};
        }
        categoryDailyBreakdown[name][dayKey] = (categoryDailyBreakdown[name][dayKey] || 0) + 1;
      }
    });

    const sortedCategories = Object.entries(categoriesCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        percentage: ((count / total) * 100).toFixed(1),
        dailyBreakdown: categoryDailyBreakdown[name]
      }));

    const topCategory = sortedCategories[0];

    // 🔹 Time-based breakdowns
    const dayCounts = {};
    const weekCounts = {};
    const monthCounts = {};
    const hourCounts = {};
    const dayOfWeekCounts = {};

    records.forEach(r => {
      const date = r.date ? new Date(r.date) : new Date();
      
      const dayKey = date.toISOString().split("T")[0];
      dayCounts[dayKey] = (dayCounts[dayKey] || 0) + 1;
      
      const weekNumber = getWeekNumber(date);
      const weekKey = `Week ${weekNumber} (${date.getFullYear()})`;
      weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
      
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      
      const hour = date.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      
      const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
      dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
    });

    const peakDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
    const peakWeek = Object.entries(weekCounts).sort((a, b) => b[1] - a[1])[0];
    const peakMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0];
    const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
    const peakDayOfWeek = Object.entries(dayOfWeekCounts).sort((a, b) => b[1] - a[1])[0];

    // 🔹 Folder usage breakdown
    const folderCount = {};
    records.forEach(r => {
      if (r.folder?.length > 0) {
        r.folder.forEach(f => {
          const folderId = typeof f === "string" ? f : f._id;
          const name = folderMap[folderId] || folderId;
          folderCount[name] = (folderCount[name] || 0) + 1;
        });
      }
    });

    const sortedFolders = Object.entries(folderCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        percentage: ((count / total) * 100).toFixed(1)
      }));

    // 🔹 Calculate statistics
    const dailyValues = Object.values(dayCounts);
    const avgDailyRecords = dailyValues.length > 0 
      ? (dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length).toFixed(1)
      : 0;

    const sortedDays = Object.entries(dayCounts).sort((a, b) => a[0].localeCompare(b[0]));
    const midPoint = Math.floor(sortedDays.length / 2);
    const firstHalf = sortedDays.slice(0, midPoint);
    const secondHalf = sortedDays.slice(midPoint);
    
    const firstHalfAvg = firstHalf.length > 0
      ? firstHalf.reduce((sum, [, count]) => sum + count, 0) / firstHalf.length
      : 0;
    const secondHalfAvg = secondHalf.length > 0
      ? secondHalf.reduce((sum, [, count]) => sum + count, 0) / secondHalf.length
      : 0;
    
    const growthRate = firstHalfAvg > 0
      ? (((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100).toFixed(1)
      : 0;

    const weekdayTotal = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      .reduce((sum, day) => sum + (dayOfWeekCounts[day] || 0), 0);
    const weekendTotal = (dayOfWeekCounts['Saturday'] || 0) + (dayOfWeekCounts['Sunday'] || 0);

    // 🔹 Build concise, scannable summary
    let summaryText = `📊 ${period.toUpperCase()} ACTIVITY REPORT\n`;
    summaryText += `${'='.repeat(50)}\n\n`;
    
    // Quick Stats
    summaryText += `QUICK STATS\n`;
    summaryText += `  Total Records: ${total}\n`;
    if (sortedDays.length > 0) {
      summaryText += `  Period: ${formatDate(sortedDays[0][0])} - ${formatDate(sortedDays[sortedDays.length - 1][0])}\n`;
    }
    summaryText += `  Daily Average: ${avgDailyRecords} records/day\n`;
    summaryText += `  Peak Day: ${peakDay ? `${formatDate(peakDay[0])} (${peakDay[1]} records)` : 'N/A'}\n`;
    summaryText += `\n`;

    // Category Summary
    summaryText += `CATEGORY BREAKDOWN\n`;
    if (topCategory) {
      summaryText += `  Top: ${topCategory.name} - ${topCategory.count} records (${topCategory.percentage}%)\n`;
      
      if (sortedCategories.length > 1) {
        summaryText += `  Others: `;
        const others = sortedCategories.slice(1, 3).map(c => `${c.name} (${c.count})`).join(', ');
        summaryText += others;
        if (sortedCategories.length > 3) {
          summaryText += `, +${sortedCategories.length - 3} more`;
        }
        summaryText += `\n`;
      }
    }
    summaryText += `\n`;

    // Daily Transactions by Category
    summaryText += `DAILY TRANSACTIONS BY CATEGORY\n`;
    sortedCategories.forEach(category => {
      const dailyEntries = Object.entries(category.dailyBreakdown).sort((a, b) => a[0].localeCompare(b[0]));
      const avgDaily = (category.count / dailyEntries.length).toFixed(1);
      
      summaryText += `\n  ${category.name} (Total: ${category.count}, Avg: ${avgDaily}/day)\n`;
      summaryText += `  ${'-'.repeat(45)}\n`;
      
      dailyEntries.forEach(([date, count]) => {
        summaryText += `    ${formatDateShort(date)}: ${count} ${count > 1 ? 'transactions' : 'transaction'}\n`;
      });
    });
    summaryText += `\n`;

    // Time Patterns
    summaryText += `TIME PATTERNS\n`;
    if (peakDayOfWeek) {
      const dayPercentage = ((peakDayOfWeek[1] / total) * 100).toFixed(1);
      summaryText += `  Most Active Day: ${peakDayOfWeek[0]} (${peakDayOfWeek[1]} records, ${dayPercentage}%)\n`;
    }
    if (peakHour) {
      summaryText += `  Peak Hour: ${formatHour(parseInt(peakHour[0]))} (${peakHour[1]} records)\n`;
    }
    const weekdayPercentage = ((weekdayTotal / total) * 100).toFixed(1);
    summaryText += `  Weekday vs Weekend: ${weekdayPercentage}% weekday, ${((weekendTotal / total) * 100).toFixed(1)}% weekend\n`;
    summaryText += `\n`;

    // Trend
    summaryText += `ACTIVITY TREND\n`;
    if (Math.abs(parseFloat(growthRate)) > 5) {
      const trend = parseFloat(growthRate) > 0 ? 'UP' : 'DOWN';
      const emoji = parseFloat(growthRate) > 0 ? '📈' : '📉';
      summaryText += `  ${emoji} ${trend} ${Math.abs(growthRate)}%`;
      
      if (parseFloat(growthRate) > 20) {
        summaryText += ` - Strong momentum!\n`;
      } else if (parseFloat(growthRate) < -20) {
        summaryText += ` - Review workflow\n`;
      } else {
        summaryText += `\n`;
      }
    } else {
      summaryText += `  Stable - Consistent activity throughout period\n`;
    }
    summaryText += `\n`;

    // Folders
    if (sortedFolders.length > 0) {
      summaryText += `FOLDER USAGE\n`;
      summaryText += `  Primary: ${sortedFolders[0].name} (${sortedFolders[0].count} records, ${sortedFolders[0].percentage}%)\n`;
      
      if (sortedFolders.length > 1) {
        sortedFolders.slice(1, 3).forEach(folder => {
          summaryText += `  ${folder.name}: ${folder.count} records (${folder.percentage}%)\n`;
        });
      }
      summaryText += `\n`;
    }

    // Key Insights
    summaryText += `KEY INSIGHTS\n`;
    const insights = [];
    
    if (parseFloat(avgDailyRecords) > 5) {
      insights.push(`Strong daily recording habit (${avgDailyRecords}/day)`);
    }
    
    if (peakDayOfWeek && peakDayOfWeek[1] > total * 0.3) {
      insights.push(`${peakDayOfWeek[0]}s are highly productive`);
    }
    
    if (topCategory && parseFloat(topCategory.percentage) > 50) {
      insights.push(`Highly focused on ${topCategory.name}`);
    } else if (sortedCategories.length >= 3) {
      insights.push(`Good balance across categories`);
    }

    if (weekendTotal > 0 && weekendTotal > total * 0.2) {
      insights.push(`Active weekend work pattern`);
    }

    if (insights.length > 0) {
      insights.forEach(insight => {
        summaryText += `  - ${insight}\n`;
      });
    } else {
      summaryText += `  - Continue current workflow\n`;
    }

    return res.status(200).json({
      summary: summaryText,
      details: {
        overview: {
          totalRecords: total,
          period,
          dateRange: {
            start: sortedDays[0]?.[0],
            end: sortedDays[sortedDays.length - 1]?.[0]
          }
        },
        statistics: {
          avgDailyRecords: parseFloat(avgDailyRecords),
          maxDailyRecords: Math.max(...dailyValues, 0),
          minDailyRecords: Math.min(...dailyValues, Infinity) === Infinity ? 0 : Math.min(...dailyValues),
          growthRate: parseFloat(growthRate)
        },
        categories: {
          breakdown: sortedCategories,
          total: sortedCategories.length,
          topCategory: topCategory || null
        },
        folders: {
          breakdown: sortedFolders,
          total: sortedFolders.length,
          topFolder: sortedFolders[0] || null
        },
        timePatterns: {
          peakDay: peakDay ? { date: peakDay[0], count: peakDay[1] } : null,
          peakWeek: peakWeek ? { week: peakWeek[0], count: peakWeek[1] } : null,
          peakMonth: peakMonth ? { month: peakMonth[0], count: peakMonth[1] } : null,
          peakHour: peakHour ? { hour: parseInt(peakHour[0]), formatted: formatHour(parseInt(peakHour[0])), count: peakHour[1] } : null,
          peakDayOfWeek: peakDayOfWeek ? { day: peakDayOfWeek[0], count: peakDayOfWeek[1] } : null,
          weekdayVsWeekend: {
            weekday: weekdayTotal,
            weekend: weekendTotal,
            weekdayPercentage: ((weekdayTotal / total) * 100).toFixed(1),
            weekendPercentage: ((weekendTotal / total) * 100).toFixed(1)
          }
        },
        rawData: {
          dailyCounts: dayCounts,
          weeklyCounts: weekCounts,
          monthlyCounts: monthCounts,
          hourlyCounts: hourCounts,
          dayOfWeekCounts: dayOfWeekCounts,
          categoryDailyBreakdown: categoryDailyBreakdown
        }
      }
    });

  } catch (err) {
    console.error("RAG SUMMARY ERROR:", err);
    return res.status(500).json({ message: "Failed to generate RAG summary" });
  }
}

// 🔹 Helper functions
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function formatHour(hour) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${period}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

function formatDateShort(dateString) {
  const date = new Date(dateString);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[date.getDay()];
  return `${dayName}, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}