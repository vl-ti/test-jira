const JiraClient = require('jira-connector')
const chokidar = require('chokidar')
const readline = require('readline');

const CONFIG = {
    "HOST": "",
    "EMAIL": "",
    "TOKEN": "",
    "BOARD": 1,
    "ME": "v.t",

    "IMAGES": "/Users/vladimir/Documents/tco19/jira_helper/image_test",
    "VIDEOS": "/Users/vladimir/Documents/tco19/jira_helper/image_test",
    "LOGS": "/Users/vladimir/Documents/tco19/jira_helper/image_test",
    "OS_IMAGE": null,
}

var jira = new JiraClient({
    host: CONFIG.HOST,
    basic_auth: {
        email: CONFIG.EMAIL,
        api_token: CONFIG.TOKEN
    },
    strictSSL: true,
});

let images = [] // all images
let videos = [] // only the last one
let logs = [] // only the last one
let issue = null

async function getState() {
    return '2019/11/10 10:53'
}

async function updateState() {

}

async function listDir(path) {
    return new Promise((res, rej) => {
        fs.readdir(path, (err, files) => {
            if (err) {
                rej(err)
            }

            res(files)
        })
    })
}

async function getMyIssues() {
    const state = await getState()

    return (await jira.board.getIssuesForBoard({
        boardId: CONFIG.BOARD,
        jql: `REPORTER = ${CONFIG.ME} ORDER BY created`
    })).issues
}

(async () => {
    // console.log(await jira.board.getAllBoards());

    const imageWathcer = chokidar.watch(CONFIG.IMAGES, { persistent: true })
    imageWathcer.on('add', (path) => {
        images.push(path)
    })
    imageWathcer.on('unlink', (path) => {
        const index = images.indexOf(path)
        if (index == -1) {
            console.error(`ERROR: Can't find ${path} in image list`)
            return
        }

        images.splice(index, 1)
    })

    const videoWatcher = chokidar.watch(CONFIG.VIDEOS, { persistent: true })
    videoWatcher.on('add', (path) => {
        videos.push(path)
    })
    videoWatcher.on('unlink', (path) => {
        const videos = videos.indexOf(path)
        if (index == -1) {
            console.error(`ERROR: Can't find ${path} in image list`)
            return
        }

        videos.splice(index, 1)
    })

    const logWatcher = chokidar.watch(CONFIG.LOGS, { persistent: true })
    logWatcher.on('add', (path) => {
        logs.push(path)
    })
    logWatcher.on('unlink', (path) => {
        const logs = logs.indexOf(path)
        if (index == -1) {
            console.error(`ERROR: Can't find ${path} in image list`)
            return
        }

        logs.splice(index, 1)
    })

    const rn = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    })

    rn.on('line', async (line) => {
        if (line === '') {
            console.log('=== IMAGES ===')
            console.log(images)
            console.log('\n')
            console.log('=== VIDEO ===')
            console.log(videos[0] || 'No videos found')
            console.log('\n')
            console.log('=== LOG ===')
            console.log(videos[0] || 'No logs found')
            console.log('\n')

            issue = (await getMyIssues())[0] || null
            if (issue) {
                console.log(`Issue: ${issue.key}  ${issue.fields.summary} \n\n`)
            } else {
                console.log('No issue found\n\n')
            }

            return
        }

        if (line === 'y') {
            let promises = []

            if (!issue) {
                console.error('ERROR: issue === null. Please refresh')
            }

            promises = images.map((path) => {
                return jira.issue.addAttachment({
                    issueKey: issue.key,
                    filename: path,
                })
            })
            if (videos[videos.length-1]) {
                promises.push(jira.issue.addAttachment({
                    issueKey: issue.key,
                    filename: videos[videos.length-1]
                }))
            } else {
                console.warn('No video attached')
            }

            if (logs[logs.length-1]) {
                promises.push(jira.issue.addAttachment({
                    issueKey: issue.key,
                    filename: logs[logs.length-1]
                }))
            } else {
                console.warn('No videlogso attached')
            }

            if (CONFIG.OS_IMAGE) {
                promises.push(jira.issue.addAttachment({
                    issueKey: issue.key,
                    filename: CONFIG.OS_IMAGE,
                }))
            }

            await Promise.all(promises)
            console.log('Uploaded')
        }
    })
})()
