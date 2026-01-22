export async function ragSummary(req, res) {
  try {
    const { period, records, year, month, week } = req.body;

    // 🔴 VALIDATION
    if (!period || !Array.isArray(records)) {
      return res.status(400).json({
        message: "Invalid request body",
        received: { period, records }
      });
    }

    if (records.length === 0) {
      return res.status(200).json({
        summary: "No records found for this period."
      });
    }

    // 🧠 RAG-style summary (future-ready)
    const total = records.length;

    // Category breakdown
    const categories = {};
    records.forEach(r => {
      if (r.category) {
        categories[r.category] = (categories[r.category] || 0) + 1;
      }
    });

    const topCategory = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])[0];

    // Optional: Detect trends
    const dateCounts = {};
    records.forEach(r => {
      const date = r.date ? r.date.split("T")[0] : "unknown"; // YYYY-MM-DD
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
    const maxDay = Object.entries(dateCounts).sort((a, b) => b[1] - a[1])[0];

    // Build summary text
    let summaryText = `Summary for the ${period} period: ${total} record${total > 1 ? "s" : ""} recorded.`;

    if (topCategory) {
      summaryText += ` Most frequent category: "${topCategory[0]}" (${topCategory[1]} records).`;
    }

    // Optional trend highlight
    if (maxDay) {
      summaryText += ` Peak activity occurred on ${maxDay[0]} with ${maxDay[1]} record${maxDay[1] > 1 ? "s" : ""}.`;
    }

    summaryText += ` Overall, activity shows consistent record creation during this time frame.`;

    // Optional future details placeholders (can be enhanced later)
    // e.g., important users, highest/lowest performing categories, or flagged records

    return res.status(200).json({
      summary: summaryText,
      details: {
        totalRecords: total,
        categoryBreakdown: categories,
        peakDate: maxDay ? { date: maxDay[0], count: maxDay[1] } : null
      }
    });

  } catch (err) {
    console.error("RAG SUMMARY ERROR:", err);
    return res.status(500).json({
      message: "Failed to generate RAG summary"
    });
  }
}
