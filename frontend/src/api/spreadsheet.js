const BACKEND_URL = import.meta.env.VITE_BACKEND_URI

export async function addSpreadSheet(spreadsheetId){
    console.log(spreadsheetId)
    try {
        const res = await fetch(`${BACKEND_URL}/users/add-spreadsheet`,{
            method:"POST",
            credentials:"include",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({spreadsheetId})
        })
        const data = await res.json()
        return data
    } catch (error) {
        console.log(error)
    }
}