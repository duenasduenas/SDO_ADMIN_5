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

export async function getAllRecords(req, res) {
    try {

        const record = await Record.find()
            .populate({ path: "title content folder category image", select: "name" })

        res.status(200).json(record)

    } catch (error) {
        return res.status(500).json({ message: error.message })
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