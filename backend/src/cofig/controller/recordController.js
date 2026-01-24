import Record from "../../models/Record.js";

export async function createRecord(req, res) {
    const { title, content, image, category } = req.body;

    try{
        if(!title || !content || !category){
            return res.status(400).json({ message: "Title and Content is Required" });
        }

        const now = new Date(); // Fixed: was "newDate = newDate()"

        function getWeekNumber(date){
            const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
            const pastDayOfYear = (date - firstDayOfYear) / 86400000;
            return Math.ceil((pastDayOfYear + firstDayOfYear.getDay() + 1) / 7); // Fixed: was "Math.ciel"
        }

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];

        const newRecord = new Record({
            title,
            content,
            category,
            image: image || null,
            createdAt: now, // Fixed: use "now" consistently
            dateInfo: {
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                monthName: monthNames[now.getMonth()],
                week: getWeekNumber(now),
                day: now.getDate(),
                dayOfWeek: now.getDay(),
                dayName: dayNames[now.getDay()],
                fullDate: now.toISOString().split('T')[0]
            }
        })

        const savedRecord = await newRecord.save()

        res.status(201).json(savedRecord) // Changed to 201 for "created"
             
    } catch (error) {
        return res.status(500).json({ message: error.message }) // Fixed: was "messesage"
    }

}

export async function getRecordById(req, res) {
    
    try{
        const record = await Record.findById(req.params.id).populate({ path: "content title category folder", select: "name"})

        if(!record) {
            return res.status(404).json({ message: "Record Not Found"})
        }
        
        res.status(200).json({record})
    } catch (error) {
        return res.status(500).json({ message: error.message})
    }
}

export async function deleteRecord(req, res) {
  try {
    const { id } = req.params;  // Get the record ID from the URL params (e.g., /record/123)

    // Validate the ID (optional but recommended for security)
    if (!id) {
      return res.status(400).json({ message: "Record ID is required" });
    }

    // Find and delete the record
    const deletedRecord = await Record.findByIdAndDelete(id);

    // Check if the record existed
    if (!deletedRecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Success response
    res.status(200).json({
      message: "Record deleted successfully",
      deletedRecord: { _id: deletedRecord._id, title: deletedRecord.title }  // Optional: Return minimal info
    });

  } catch (error) {
    console.error("Delete record error:", error);
    res.status(500).json({ message: "Failed to delete record", error: error.message });
  }
}


// Backend Pagination, Search, Filter, Sort
export async function getAllRecords(req, res) {
  try {
    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const categoryFilter = req.query.category || "";
    const folderFilter = req.query.folder || "";
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // Build query filters
    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } }
      ];
    }

    // Category filter
    if (categoryFilter) {
      query.category = categoryFilter;
    }

    // Folder filter
    if (folderFilter) {
      query.folder = folderFilter;
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Get total count
    const totalRecords = await Record.countDocuments(query);

    // Fetch records
    // ⚠️ ONLY populate reference fields (folder, category)
    // ❌ DON'T populate regular fields like title, content, image
    const records = await Record.find(query)
      .populate({ path: "folder", select: "name" })  // ✅ if folder is a reference
      .populate({ path: "category", select: "name" })  // ✅ if category is a reference
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    // Pagination metadata
    const totalPages = Math.ceil(totalRecords / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      records,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        recordsPerPage: limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      }
    });
  } catch (error) {
    console.error("GET ALL RECORDS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
}

// Optional: Separate endpoint for getting all categories
export async function getAllCategories(req, res) {
  try {
    const categories = await Category.find().select("name");
    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// New function for dedicated categories endpoint (optional, for efficiency)
export async function getCategories(req, res) {
  try {
    const categories = await Record.distinct('category');  // Or the fallback version I provided earlier
    const filteredCategories = categories.filter(Boolean);
    res.status(200).json({ categories: filteredCategories });
  } catch (error) {
    console.error("getCategories error:", error);
    res.status(500).json({ message: error.message });
  }
}

export async function editRecord(req, res){
    const { title, content, image, category } = req.body;

    try{
        if( !title || !content || !category ){
            return res.status(404).json({message: "Title, Content, Category is Missing"})
        }

        const editRecord = await Record.findByIdAndUpdate(req.params.id, { title, content, image, category })

        res.status(200).json({ message: "Editted", editRecord })       

    } catch (error) {
        return res.status(500).json({ message: error.message })
    }

}

export async function getRecordsByDay(req, res) {
    const { year, month, day } = req.params

    try{ 
        const records = await Record.find({
            'dateInfo.year': parseInt(year),
            'dateInfo.month': parseInt(month),
            'dateInfo.day': parseInt(day)
        }). sort ({ createdAt: -1 })

        res.status(200).json({ records, count: records.length })

    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export async function getRecordsByMonth(req, res) {
    const { year, month } = req.params

    console.log('Year:', year, 'Month:', month, "get by month");

    try{
        const records = await Record.find({
            'dateInfo.year': parseInt(year),
            'dateInfo.month': parseInt(month)
        }).sort({ createdAt: -1 })

        res.status(200).json({ records, count: records.length })

    } catch(error) {
        return res.status(500).json({message: error.message})
    }
    
}

export async function getRecordsByWeek(req, res) {
    const { year, week } = req.params

    console.log('Year:', year, 'week:', week, "get by week");

    try{
        const records = await Record.find({
            'dateInfo.year': parseInt(year),
            'dateInfo.week': parseInt(week)
        }).sort({createdAt: -1})

        res.status(200).json({ records, count: records.length })

    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}