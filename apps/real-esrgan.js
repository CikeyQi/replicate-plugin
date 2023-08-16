import plugin from '../../../lib/plugins/plugin.js'
import core from '../model/replicate.js'
import parseImg from '../utils/utils.js'
import fetch from 'node-fetch'

export class real_esrgan extends plugin {
  constructor() {
    super({
      name: 'sdxl',
      dsc: 'A text-to-image generative AI model that creates beautiful 1024x1024 images',
      event: 'message',
      priority: 5000,
      rule: [{
        reg: '#?超分(\d+倍)?$',
        fnc: 'realesrgan',
      }]
    })

  }

  async realesrgan(e) {
    e = await parseImg(e)
    let scaleMatch = e.msg.match(/(\d+)倍/)
    let scale = scaleMatch ? parseInt(scaleMatch[1]) : 4;
    if (!e.img) {
      await e.reply('请附带一张图片', true);
      return true
    }
    let response = await fetch(e.img);
    let image = Buffer.from(await response.arrayBuffer()).toString('base64');

    let options = {
      image: image,
      scale: scale,
    }

    await e.reply('好的，正在超分图片，请稍等...')

    console.log(options)

    let result = await core.run("nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b", options)

    if (result === 'SIGN_IN_REQUIRED') {
      await e.reply('您的IP已达到免费次数上限，请等会再次尝试', true);
      return true
    }

    if (result) {
      let response = await fetch(result)
      let base64 = Buffer.from(await response.arrayBuffer()).toString('base64');
      e.reply([segment.at(e.user_id),'好啦好啦，图片超分好啦！'], true);
      e.reply(segment.image('base64://' + base64));
      return true
    } else {
      await e.reply('图片超分失败，请稍后再试', true);
      return true
    }
  }
}