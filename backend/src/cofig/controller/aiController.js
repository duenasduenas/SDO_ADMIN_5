export async function ragSummary(req, res) {
  try {
    const { period, records, year, month, week } = req.body;

    // 🔴 VALIDATION (this is what caused the 400)
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

    // 🧠 Simple RAG-style summary (no OpenAI)
    const total = records.length;
    const categories = {};

    records.forEach(r => {
      if (r.category) {
        categories[r.category] =
          (categories[r.category] || 0) + 1;
      }
    });

    const topCategory = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])[0];

    let summaryText = `This ${period} period contains ${total} records.`;

    if (topCategory) {
      summaryText += ` The most frequent category is "${topCategory[0]}" with ${topCategory[1]} records.`;
    }

    summaryText += ` Overall activity shows consistent record creation during this time frame.`;

    return res.status(200).json({
      summary: summaryText
    });

  } catch (err) {
    console.error("RAG SUMMARY ERROR:", err);
    return res.status(500).json({
      message: "Failed to generate AI summary"
    });
  }
}
