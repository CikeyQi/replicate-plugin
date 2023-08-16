import plugin from '../../../lib/plugins/plugin.js'
import core from '../model/replicate.js'
import fetch from 'node-fetch'

export class sd_xl extends plugin {
  constructor() {
    super({
      name: 'sdxl',
      dsc: 'A text-to-image generative AI model that creates beautiful 1024x1024 images',
      event: 'message',
      priority: 5000,
      rule: [{
        reg: '#?xl绘图.*$',
        fnc: 'sdxl',
      }]
    })

  }

  async sdxl(e) {
    let msg = e.msg.replace(/#?xl绘图/, '').trim();
    let widthMatch = msg.match(/宽度(\d+)/);
    let width = widthMatch ? parseInt(widthMatch[1]) : 1024;
    msg = msg.replace(/宽度\d+/, '');
    let heightMatch = msg.match(/高度(\d+)/);
    let height = heightMatch ? parseInt(heightMatch[1]) : 1024;
    msg = msg.replace(/高度\d+/, '');
    let schedulerMatch = msg.match(/调度器(\w+)/);
    let scheduler = schedulerMatch ? schedulerMatch[1] : 'K_EULER';
    if (!['DDIM', 'DPMSolverMultistep', 'HeunDiscrete', 'KarrasDPM', 'K_EULER_ANCESTRAL', 'K_EULER', 'PNDM'].includes(scheduler)) {
      e.reply('调度器不合法，请重试');
      return true;
    }
    msg = msg.replace(/调度器\w+/, '');
    let num_inference_stepsMatch = msg.match(/步数(\d+)/);
    let num_inference_steps = num_inference_stepsMatch ? parseInt(num_inference_stepsMatch[1]) : 50;
    msg = msg.replace(/步数\d+/, '');
    let guidance_scaleMatch = msg.match(/自由度(\d+(\.\d+)?)/);
    let guidance_scale = guidance_scaleMatch ? parseInt(guidance_scaleMatch[1]) : 7.5
    msg = msg.replace(/自由度\d+(\.\d+)?/, '');
    let seedMatch = msg.match(/种子(\d+)/);
    let seed = seedMatch ? parseInt(seedMatch[1]) : 0;
    msg = msg.replace(/种子\d+/, '');
    let negative_prompt = msg.split('负面')[1] || '';
    let prompt = msg.split('负面')[0] || '';
    let refineMatch = msg.match(/精修模式(\w+)/);
    let refine = refineMatch ? refineMatch[1] : 'no_refiner';
    if (!['no_refiner', 'expert_ensemble_refiner', 'base_image_refiner'].includes(refine)) {
      e.reply('精修模式不合法，请重试');
      return true;
    }
    let refine_stepsMatch = msg.match(/精修步数(\d+)/)
    let refine_steps = refine_stepsMatch ? parseInt(refine_stepsMatch[1]) : num_inference_steps

    let options = {
      prompt: prompt,
      negative_prompt: negative_prompt,
      width: width,
      height: height,
      scheduler: scheduler,
      num_inference_steps: num_inference_steps,
      guidance_scale: guidance_scale,
      seed: seed,
      refine: refine,
      refine_steps: refine_steps
    }

    await e.reply('好的，正在生成图片，请稍等...')

    console.log(options)

    let result = await core.run("stability-ai/sdxl:a00d0b7dcbb9c3fbb34ba87d2d5b46c56969c84a628bf778a7fdaec30b1b99c5", options)

    if (result === 'SIGN_IN_REQUIRED') {
      await e.reply('您的IP已达到免费次数上限，请等会再次尝试', true);
      return true
    }

    if (result) {
      let response = await fetch(result)
      let base64 = Buffer.from(await response.arrayBuffer()).toString('base64');
      e.reply([segment.at(e.user_id),'好啦好啦，图片生成好啦！'], true);
      e.reply(segment.image('base64://' + base64));
      return true
    } else {
      await e.reply('图片生成失败，请稍后再试', true);
      return true
    }
  }
}