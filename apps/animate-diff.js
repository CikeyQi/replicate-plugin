import plugin from '../../../lib/plugins/plugin.js'
import { pluginResources } from '../model/path.js'
import Config from '../components/Config.js'
import core from '../model/replicate.js'
import Init from '../model/init.js'
import Log from '../utils/logs.js'
import fetch from 'node-fetch'
import fs from 'fs'

export class animate_diff extends plugin {
  constructor() {
    super({
      name: 'animate-diff',
      dsc: 'Animate Your Personalized Text-to-Image Diffusion Models',
      event: 'message',
      priority: 5000,
      rule: [{
        reg: '#?ai动画.*$',
        fnc: 'animatediff',
      }]
    })

  }

  async animatediff(e) {
    let config = await Config.getConfig()
    let msg = e.msg.replace(/#?ai动画/, '')
    let stepMatch = msg.match(/步数(\d+)/);
    let step = stepMatch ? parseInt(stepMatch[1]) : 25;
    msg = msg.replace(/步数\d+/, '');
    let guidance_scaleMatch = msg.match(/自由度(\d+(\.\d+)?)/);
    let guidance_scale = guidance_scaleMatch ? parseInt(guidance_scaleMatch[1]) : 7.5
    msg = msg.replace(/自由度\d+(\.\d+)?/, '');
    let seedMatch = msg.match(/种子(\d+)/);
    let seed = seedMatch ? parseInt(seedMatch[1]) : 0;
    msg = msg.replace(/种子\d+/, '');
    let n_prompt = msg.split('负面')[1] || '';
    let prompt = msg.split('负面')[0] || '';

    let motion_module = config['animate-diff'].motion_module
    let path = config['animate-diff'].path

    let options = {
      motion_module: motion_module,
      path: path,
      prompt: prompt,
      n_prompt: n_prompt,
      step: step,
      guidance_scale: guidance_scale,
      seed: seed,
    }

    let filePath = pluginResources + '/animate_diff/' + new Date().getTime() + '.mp4';

    await e.reply('好的，正在生成动画，请稍等...')

    let result = await core.run("lucataco/animate-diff:1531004ee4c98894ab11f8a4ce6206099e732c1da15121987a8eef54828f0663", options)

    if (result === 'SIGN_IN_REQUIRED') {
      await e.reply('您的IP已达到免费次数上限，请等会再次尝试', true);
      return true
    }

    if (result) {
      try {
        const response = await fetch(result);
        if (!response.ok) {
          Log.e('视频下载失败', response.status, response.statusText);
          e.reply('下载视频失败，请重试');
          return true;
        }
        const writer = fs.createWriteStream(filePath);
        response.body.pipe(writer);
        await new Promise((resolve, reject) => {
          writer.on('finish', () => {
            e.reply([segment.at(e.user_id),'好啦好啦，动画生成好啦！'], true);
            e.reply(segment.video(filePath));
            resolve();
          });
          writer.on('error', (err) => {
            reject(err);
          });
        });
      } catch (err) {
        Log.e('视频下载失败', err);
        throw err;
      }
    } else {
      Log.e('动画生成失败');
      e.reply('动画生成失败，请重试');
    }
    return false
  }
}