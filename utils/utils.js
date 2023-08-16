export default async function parseImg(e) {
    if (e.msg && e.msg.includes('自己')) {
        e.img = [`https://q1.qlogo.cn/g?b=qq&s=0&nk=${e.user_id}`]
    }
    if (!e.img) {
        if (e.atBot) {
            e.img = [`https://q1.qlogo.cn/g?b=qq&s=0&nk=${cfg.qq}`];
        }
        if (e.at) {
            e.img = [`https://q1.qlogo.cn/g?b=qq&s=0&nk=${e.at}`];
        }
    }
    if (e.source) {
        let reply;
        if (e.isGroup) {
            reply = (await e.group.getChatHistory(e.source.seq, 1)).pop()?.message;
        } else {
            reply = (await e.friend.getChatHistory(e.source.time, 1)).pop()?.message;
        }
        if (reply) {
            for (let val of reply) {
                if (val.type == "image") {
                    e.img = [val.url];
                    break;
                }
            }
        }
    }
    return e
}