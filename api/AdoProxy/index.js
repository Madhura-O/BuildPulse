module.exports = async function (context, req) {
    const PAT = process.env.ADO_PAT;
    if (!PAT) {
        context.res = { status: 500, body: "ADO_PAT is not configured in Application Settings." };
        return;
    }

    const adoPath = req.query.path;
    if (!adoPath) {
        context.res = { status: 400, body: "Missing required query parameter: 'path'." };
        return;
    }

    const method  = (req.method || "GET").toUpperCase();
    const adoUrl  = "https://dev.azure.com/" + adoPath;
    const authHeader = "Basic " + Buffer.from(":" + PAT).toString("base64");

    const fetchOptions = {
        method:  method,
        headers: {
            "Authorization": authHeader,
            "Content-Type":  "application/json"
        }
    };

    if (method === "PATCH" || method === "POST" || method === "PUT") {
        fetchOptions.body = req.rawBody || JSON.stringify(req.body || {});
    }

    try {
        const response = await fetch(adoUrl, fetchOptions);
        const contentType = response.headers.get("content-type") || "";
        let body;
        if (contentType.includes("application/json")) {
            body = await response.json();
        } else {
            body = await response.text();
        }
        context.res = {
            status:  response.status,
            headers: { "Content-Type": "application/json" },
            body:    typeof body === "string" ? body : JSON.stringify(body)
        };
    } catch (e) {
        context.res = { status: 502, body: "Proxy error: " + e.message };
    }
};
