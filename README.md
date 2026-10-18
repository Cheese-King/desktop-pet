# 栖伴 a0.6 便携版

双击 `启动栖伴.bat`。首次会打开使用准备窗口，设置中优先配置对话和语音服务。右键桌宠或点击托盘图标可打开任务中心。旧启动入口仍可使用。

本次已修复 EPIPE 日志报错，移除 Live2D 模型导入和切换，固定使用内置角色。详细流程和更新说明见 `更新说明.md`。桌宠程序位于 `app`，语音接口位于 `voice-service`。

本包不包含 Node、Python/CUDA、GPT-SoVITS 模型权重和训练环境。默认会在 `a0.5` 的上一级目录查找：

```text
GPT-SoVITS-v2pro-20250604-nvidia50\runtime\python.exe
```

如果外部环境在别处，新建 `environment.path.txt`，第一行填写 GPT-SoVITS 根目录的绝对路径，例如：

```text
D:\AI\GPT-SoVITS-v2pro-20250604-nvidia50
```

也可以在启动前设置环境变量 `GPT_SOVITS_ROOT`。优先级为：环境变量、`environment.path.txt`、默认相邻目录。

语音角色、参考音频和模型路径在 `voice-service\voice.config.json` 与 `voice-service\tts_infer.yaml` 中配置，相关文件路径均指向外部 GPT-SoVITS 环境。
