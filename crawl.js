const { JSDOM } = require("jsdom");

function normalizeURL(url) {
    const urlObj = new URL(url);

    let fullPath = `${urlObj.host}${urlObj.pathname}`;

    if (fullPath.length > 0 && fullPath.slice(-1) === "/") {
        fullPath = fullPath.slice(0, -1);
    }

    return fullPath;
}

function getURLsFromHTML(htmlBody, baseURL) {
    const dom = new JSDOM(htmlBody);
    const foundURLs = dom.window.document.body.querySelectorAll("a");

    let result = [];

    for (let url of foundURLs) {
        let temp = url.href;
        if (temp.slice(0, 1) === "/") {
            temp = `${baseURL}${temp}`;
            try {
                result.push(new URL(temp, baseURL).href);
            } catch (error) {
                console.log(error);
            }
        } else {
            try {
                result.push(new URL(temp).href);
            } catch (error) {
                console.log(error);
            }
        }
    }

    return result;
}

async function crawlPage(baseURL, currentURL, pages) {
    const currentUrlObj = new URL(currentURL);
    const baseUrlObj = new URL(baseURL);

    if (currentUrlObj.hostname !== baseUrlObj.hostname) return pages;

    const normalizedUrl = normalizeURL(currentURL);

    if (pages[normalizedUrl] > 0) {
        pages[normalizedUrl]++;
        return pages;
    }

    if (currentURL === baseURL) {
        pages[normalizedUrl] = 0;
    } else {
        pages[normalizedUrl] = 1;
    }

    console.log(`crawiling ${currentURL}`);

    let htmlBody = "";

    try {
        const response = await fetch(currentURL);

        if (response.status >= 400) {
            console.log(`Got HTTP error. Response status: ${response.status}`);
            return pages;
        }

        const contentType = response.headers.get("content-type");

        if (!contentType.includes("text/html")) {
            console.log(`Got non-html response: ${contentType}`);
            return pages;
        }

        htmlBody = await response.text();
    } catch (error) {
        console.log(error.message);
    }

    const nextURLs = getURLsFromHTML(htmlBody, baseURL);

    for (let nextURL of nextURLs) {
        pages = await crawlPage(baseURL, nextURL, pages);
    }

    return pages;
}

module.exports = {
    normalizeURL,
    getURLsFromHTML,
    crawlPage,
};
