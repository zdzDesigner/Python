## 需求文档：有声书项目

# 有声书项目需求文档

## 1. 项目概述

### 1.1 项目名称
AI有声书阅读平台

### 1.2 项目背景
随着数字化阅读的普及和人工智能技术的发展，传统文字阅读逐渐向多媒体阅读转变。本项目旨在利用先进的TTS（Text-to-Speech）技术，即index-tts，为用户提供高质量的有声书服务，满足用户在不同场景下的阅读需求，如通勤、运动或视觉障碍人群的阅读需求。

### 1.3 项目目标
- 为用户提供高质量的语音阅读体验
- 支持多种格式的电子文档转换为语音
- 提供个性化的声音参数调整功能
- 实现离线有声书下载功能
- 构建用户友好的界面和交互体验

---

## 2. 技术栈和架构

### 2.1 核心技术
- **TTS引擎**: index-tts
- **前端框架**: React/Vue.js (Web), Flutter/React Native (移动端)
- **后端框架**: Node.js/Python Flask/Django
- **数据库**: PostgreSQL/MongoDB
- **音频处理**: FFmpeg
- **音频格式**: MP3/WAV/OGG

### 2.2 架构设计
- **微服务架构**：音频生成服务、内容管理服务、用户管理服务
- **负载均衡**: Nginx
- **缓存层**: Redis
- **CDN**: 用于音频文件分发

---

## 3. 功能需求

### 3.1 核心功能

#### 3.1.1 文档上传与解析
- 支持PDF、EPUB、TXT、Word等常见文档格式
- 自动提取文档结构（章节、页码、段落等）
- 支持文档预览功能

#### 3.1.2 文字转语音功能
- 集成index-tts引擎实现高质量语音合成
- 支持多种声音类型选择（男声、女声、儿童声等）
- 支持语音速度、音调、音量调节
- 支持多语言语音合成

#### 3.1.3 有声书播放器
- 基础播放控制（播放/暂停/停止/快进/快退）
- 播放进度显示和跳转
- 书签功能
- 播放历史记录

#### 3.1.4 个性化设置
- 个性化语音参数配置
- 播放偏好设置
- 主题切换功能

### 3.2 辅助功能

#### 3.2.1 用户管理
- 用户注册/登录/验证
- 用户信息管理
- 个性化配置同步

#### 3.2.2 内容管理
- 个人书库管理
- 收藏功能
- 阅读进度同步

#### 3.2.3 社交功能
- 书评和评价
- 阅读心得分享
- 推荐功能

---

## 4. 非功能需求

### 4.1 性能需求
- 文档解析时间不超过30秒（对于200页文档）
- 音频生成速度不低于实时速度的2倍
- 播放器响应时间不超过500ms
- 支持1000+并发用户同时使用

### 4.2 可用性需求
- 99.5%的系统可用性
- 平均故障恢复时间不超过30分钟
- 自动备份机制

### 4.3 安全性需求
- 用户数据加密存储
- 文件上传安全检查
- 防止恶意脚本注入

### 4.4 兼容性需求
- 支持主流浏览器（Chrome、Safari、Firefox、Edge）
- 支持iOS和Android移动端
- 支持多种操作系统（Windows、macOS、Linux）

---

## 5. 开发计划

### 5.1 开发周期
- Phase 1 (2-4周): 核心TTS功能开发
- Phase 2 (4-6周): 用户界面和交互开发
- Phase 3 (6-8周): 服务端开发和部署
- Phase 4 (2-3周): 测试和优化
- Phase 5 (1-2周): 上线准备

### 5.2 团队分工
- 前端开发工程师: 2人（负责用户界面）
- 后端开发工程师: 2人（负责服务端逻辑）
- AI算法工程师: 1人（负责TTS优化）
- 测试工程师: 1人（负责质量保证）

---

## 6. 测试策略

### 6.1 功能测试
- 单元测试覆盖率达到80%以上
- 集成测试确保各模块协同工作
- 端到端测试确保用户流程畅通

### 6.2 性能测试
- 压力测试验证系统承载能力
- 负载测试确保系统稳定性
- 并发测试验证多用户场景

### 6.3 用户体验测试
- 可用性测试收集用户反馈
- A/B测试优化界面设计
- 用户调研了解实际需求

---

## 7. 部署和维护

### 7.1 部署方案
- 云服务器部署（AWS/阿里云等）
- 容器化部署（Docker）
- 自动化CI/CD流水线

### 7.2 维护计划
- 定期系统监控和日志分析
- 定期安全更新和补丁安装
- 用户反馈收集和功能优化

### 7.3 运维监控
- 系统性能监控
- 错误日志收集
- 用户使用行为分析

---

## 8. 预期成果

- 高质量的有声书转换服务
- 用户友好的交互体验
- 高效的音频生成能力
- 可扩展的系统架构

---

## 9. 风险评估

### 9.1 技术风险
- TTS引擎性能可能不满足实时需求
- 大文档处理可能遇到内存限制

### 9.2 解决方案
- 实现分段处理机制
- 采用异步处理方式
- 增加缓存优化

--- 

**文档版本**: v1.0  
**创建日期**: 2025年11月6日  
**最后更新**: 2025年11月6日



### 上传章节文本

### 拆分章节文本
创建TTSList组建放到TextDataSettings下方,在TTSList组建中把上传的JSON文件拆分出每项为
{
  "speaker": "旁白",
  "content": "夜，已经很深了。",
  "tone": "neutral",
  "intensity": 5,
  "delay": 500
}
这个结构的数据，
{
  speaker:角色
  dubbing:配音
  content:文本内容
  tone:情感
  intensity:情感比重
  delay:延迟
}
并把解析的数据渲染到列表中
@web/src/components/TTSList.jsx  这里的结构改成table 使用
{
  speaker:角色
  content:文本内容
  tone:情感
  intensity:情感比重
  delay:延迟
}
标题

### 删除音频
@web/src/components/FileTree.jsx, 在删除列表中的文件成功后，不要重新请求列表，只要删除当前的元素就可以了

### 正在播放的文件tag
在 @web/src/components/AudioPlayer.jsx 组建中添加播放完成事件；在@web/src/components/FileTree.jsx 组建中列表中设置正在播放的音频元素添加背景色


### 关闭正在播放的文件tag
在 @web/src/components/AudioPlayer.jsx 组建中添加播放暂停事件；在@web/src/components/FileTree.jsx 组建中在列表中点击正在播放的音频元素暂停播放当前音频, 列表元素恢复默认, 
- fix
onPauseCurrent 并未添加到@web/src/App.jsx 中



### 添加配音
在 @web/src/components/TTSList.jsx 中的table ,添加 dubbing 字段为配音
{
  speaker:角色
  dubbing:配音
  content:文本内容
  tone:情感
  intensity:情感比重
  delay:延迟
}

配音字段可以用ant-design 的select组件, 数据使用左侧的音频列表数据(在select中可以不用树状表示)


### 添加训练和播放
@web/src/components/TTSList.jsx
  在table的最右侧添加一个操作选项，添加2个操作，第一个是训练图标，第二个是播放图标


抽象 @web/src/App.jsx 组件中的 fetch 'http://localhost:8081/api/tts' 接口到 src/service/api/tts.js 文件中


    text: text,
    speaker_audio_path: speakerAudioPath,
    output_wav_path: '', // The backend will generate the path
    emotion_text: 'default',
    emotion_alpha: 0.7,
    interval_silence: 500



### 点击训练
在 @web/src/components/TTSList.jsx 组建中点击ExperimentOutlined(训练按钮) 调用@web/src/service/api/tts.js 中的 synthesizeTTS 接口, synthesizeTTS接口的参数调整为 当前tr中的的数据，对应关系如下
{
  speaker_audio_path:dubbing
  text:content
  emotion_text:tone
  emotion_alpha:intensity
  interval_silence:delay
}
同时也要修正 @web/src/App.jsx 中调用synthesizeTTS的传参


- 映射dubbing
speaker_audio_path参数设置为当前tr中的dubbing的值

- 训练过程
在 @web/src/components/TTSList.jsx 组建中点击ExperimentOutlined(训练按钮)后，PlayCircleOutlined(播放按钮)设置禁用, ExperimentOutlined按钮也禁用，等待训练完成后恢复



- 训练后的播放
在 @web/src/components/TTSList.jsx 组建中点击ExperimentOutlined(训练按钮)等待完成后，把返回的数据记录到当前record.outpath中, 点击PlayCircleOutlined(播放按钮)播放音频

- 训练前的状态
在 @web/src/components/TTSList.jsx 组建中点击ExperimentOutlined(训练按钮)等待完成后，把返回的数据记录到当前record.outpath中, 点击PlayCircleOutlined(播放按钮)播放音频

- 左侧训练(不用刷新列表)
在@web/src/components/Sidebar.jsx 组件中TTSSynthesizer训练完成后，

### MD5 音频文件名
 在调用 /api/tts 接口，go 服务使用当前收到的   {
        "text": "需要转换为语音的文本",
        "speaker_audio_path": "参考音频文件的路径",
        "output_wav_path": "", // 由后端生成
        "emotion_text": "情感描述（如：happy, sad, angry）",
        "emotion_alpha": 0.7, // 情感强度
        "interval_silence": 500 // 静默间隔（毫秒）
      }
  这几个参数通过md5 这几个参数用于生成后的音频名称




### 添加角色配音(弹框)
在 @/home/zdz/Documents/Try/Python/course/http-server/go_client/web/src/components/TTSList.jsx 中的table上方添加一个"角色配音"按钮，点击这按钮打开一个弹框，弹框中的内容是一个列表，列表的每一行分为左右两块，左边显示jsonData数据的角色名称（需要去重），右边是一个select组建，select里面的内容使用当前TTSList的audioFiles参数，最终得到角色名称和音频地址的映射数据，点击确定
 后把映射的数据赋值到当前的table音频列中的select组建中

### 批量训练
在@/home/zdz/Documents/Try/Python/course/http-server/go_client/web/src/components/TTSList.jsx 中的“角色配音”按钮右侧添加一个批量训练按钮，点击这个按钮会把当前所有table中的数据逐一调用synthesizeTTS接口用去训练，并且执行训练的当前数 据中的ExperimentOutlined和PlayCircleOutlined 和点击ExperimentOutlined时的效果要保持一致







### 点击播放逻辑(不存在outpath)
在@/home/zdz/Documents/Try/Python/course/http-server/go_client/web/src/components/TTSList.jsx  中TTSTable组件里如何点击 PlayCircleOutlined 按钮, 在执行 handlePlay 前如果没有 record中没有outpath ,则根据当前的record 参数请求go 服务接口，类似/home/zdz/Documents/Try/Python/course/http-server/go_client/server/handlers.go  synthesizeTTS接口中的md5(应该抽象出来), 通过参数的md5来获取本地outpath目录下是否有该文件，有侧返回outpath参数并赋值给web中的record，然后执行handlePlay函数
```md
1. 当前的 ttsHandler包含了文件名生成（MD5）、文件存在性检查和语音合成的所有逻辑。我们的目标是将其中的文件名生成和检查逻辑提取出来，创建一个新的、独立的"check" 接口。

2. 现在，我需要为这个新函数添加 crypto/md5 和 path/filepath 的导入。同时，我将把 handlers.go中生成文件名的逻辑替换为对这个新函数的调用，并创建新的 checkTTSExistsHandler 处理器。

3. 接下来，我将修改 handlers.go：
   1. 使用新的 GenerateTTSFilename 函数。
   2. 创建 checkTTSExistsHandler。
   3. 从 ttsHandler 中移除旧的 MD5 逻辑。

✦ 拿到 main.go 内容了，现在添加 checkTTSExistsHandler 的新路由。

✦ 后端完工。已重构文件名生成、创建文件存在性检查处理器，并注册了新路由。现在转到前端：修改 tts.js 添加 checkTTSExists 函数，然后更新TTSList.jsx 的 handlePlay 以在未找到本地音频时调用该函数。先从 tts.js 开始。

```




### 可编辑table
 @web/src/components/TTSList.jsx  TTSTable 组件点击 "角色", "文本内容", "情感","情感比重","延迟" 均可以编辑, 其中"情感比重","延迟"限制为数字


### 训练进度
@web/src/components/TTSList.jsx 点击"批量训练" 后, "角色配音"禁用, "批量训练"loadding, "批量训练"的右侧出现当前训练的"进度条", 当关闭进度条时训练中段， "角色配音"和"批量训练"按钮恢复, 当训练完成后"进度条"关闭，"角色配音"和"批量训练"按钮恢复.

### 整理文件名
@server/services.go
  的ReadDirectoryRecursive接口中如果文件名出现了RemoveSpecialSymbols接口出现的特殊字符就清除掉并更新文件名称


### 创建tts_records model
参考 @server/db/user.go  创建一个tts_records model 接口

### 完成tts_records数据存存
在 @server/handlers.go  中添加一个 ttsTplHandler 接口，通过@server/db/tts_record.go model  把 @web/src/components/TextDataSettings.jsx handleJsonSubmit 解析后的数据添加到 tts_records 表中
在 @web/src/service/api/tts.js 中添加 ttsTplSave 接口，在 @web/src/components/TextDataSettings.jsx  handleJsonSubmit 中调用


### 更新tts_records DB 数据
@server/handlers.go ttsHandler 在训练完成后返回 OutputWavPath 数据, 更新@server/db/tts_record.go 当前id 的 OutputWavPath 数据

在 @web/src/components/TTSList.jsx 组件中, 编辑 "文本内容", "情感","情感比重","延迟"内容后更新当前id的数据

### 删除数据
在@web/src/components/TTSList.jsx 中的"批量训练"按钮所在行的最右侧,添加一个"批量删除"的按钮，功能是删除当前book_id 和 section_id 的所有数据


### 添加尾截取
在@web/src/components/TTSList.jsx table 中的延迟后添加尾截取字段 truncate (audio_end_truncate)
在@web/src/components/AudioPlayer.jsx 中添加一个 end_truncate 参数, 可以设置播放到末尾多少毫秒前停止, 默认为0

把 @web/src/components/TTSList.jsx 中的playAudio 抽象出去也添加一个end_truncate 参数, 可以设置播放到末尾多少毫秒前停止, 默认为0


@web/src/components/TTSList.jsx  table 虚拟滚动时 EditableCell 组建input会带上之前编辑的数据
@web/src/components/TTSList.jsx  table 的操作中添加一个"锁定"操作，点击"锁定"后当前行不可编辑，只能点击播放

> @web/src/components/TTSList.jsx  把"批量删除"按钮布局更改为右对齐
> @web/src/components/TTSList.jsx  在"批量训练"按钮右侧添加"批量合成"按钮

@server/main.go中添加一个批量合成的路由, 并在@server/handlers.go 中具体实现，
使用@server/audio.go 中的Joint接口, inputs参数为当前要合成的音频地址集合，output为输出地址,
inputs 集合数据通过web上传的user_id,book_id,section_id,no 组合查询 output_wav_path 生成的数据集合
output 地址为`user_id`_`book_id`_`section_id`_`当前时间戳`


@server/main.go中我新添加了"/auto/joint"路由调用batchSynthesizeHandler 函数; 你继续在@web/src/components/TTSList.jsx 中添加点击"批量合成"的按钮请求 "/auto/joint"服务接口来闭环当前业务，`user_id`, `book_id`, `section_id`, 暂时默认为0


@web/src/components/TTSList.jsx 的table 中添加删除按钮, 并在go服务实现删除功能


### 添加web路由
@web/src/App.jsx 中添加 audiobook/list 路由跳转到AudioBook组件, 默认路由
@web/src/App.jsx 中添加 audiobook/section 路由跳转到AudioSection组件
@web/src/App.jsx 中添加 dubbing/list 路由 跳转到DubbingList组件

### 服务创建sections模块
@server/build/SQL/sqlite.sql 新增`sections`表，包含`id`, `book_id`,`name`,`describe`,`size`,`created_at`,`updated_at` 字段,
根据sections表在@server/db/ 目录中创建`sections.go` 文件,其中的具体实现参考 @server/db/tts_record.go 文件; 同时在 @server/handlers.go 文件完成`sections`的*增*，*删*，*改*, *查* 功能。同时在@server/main.go 添加对应的路由

@server/handlers.go 中sectionsUpdateHandler不需要先查询id数据，因为UpdateByID已经支持更新部分数据，更新完成后也无需查询，直接返回"success"即可; **记住这种更新操作**

### Web 添加section列表
<!-- @web/src/pages/Section.jsx 中的TTSList组件左侧添加SectionList 组件, 组件中是section列表，包含增删改查的功能 , **要求`交互方便`, `美观`, `简洁`** -->
@web/src/components/SectionList.jsx组件中不需要table结构,一个list结构即可, 宽度在`200px`，在list上方有个`添加章节`的按钮，list的item中只需要展示名称，点击名称可编辑, item内右侧是**删除按钮**
@web/src/components/SectionList.jsx 点击list中的item名称，变为input ，只需要编辑名称，焦点消失自动保存
@web/src/components/SectionList.jsx 点击list中在编辑item名称时要**校验**数据`是否更新`, 数据`不能为空`, 编辑操作保持美观
@web/src/components/SectionList.jsx 去除创建操作
@web/src/components/SectionList.jsx 保留`添加章节`的按钮, 点击后自动在list中最后追加item, 并且处于*编辑状态*
@web/src/components/SectionList.jsx 点击list中在编辑item名称时input太长，outline 过于明显
@web/src/components/SectionList.jsx 点击list中在编辑item名称时input晃动, 和未*聚焦*前高度不一致
@web/src/components/SectionList.jsx 点击list中在编辑item名称时input晃动, 和未*聚焦*前**宽度**不一致
@web/src/components/SectionList.jsx 点击list中在编辑item中的`删除按钮`太小，confirm 使用ant-design 组件
@web/src/components/SectionList.jsx 点击list中在编辑item中的`删除按钮`替换图标
@web/src/components/SectionList.jsx list中鼠标移动到item中再显示`删除按钮`, 图标换成"x"
@web/src/components/SectionList.jsx 删除按钮 使用@web/src/components/TTSList.jsx table中删除按钮的confirm组件


@/home/zdz/Documents/Try/Python/course/http-server/go_client/web/src/components/TextDataSettings.jsx
  组件中执行uploadProps操作后，把文件上传到go server 并返回文件内容












## dubbings
@web/src/pages/dubbing/Dubbing.jsx 中写*音色*管理的页面, 页面中包含对*音色*的`增、删、改、查`功能
每个*音色*中包含`名称(name)`, `头像(avatar)`,`年龄文本(age_text)`, `情感文本(emotion_text)`, `音频地址(wav_path)`, 其中`音频地址`需要从本地上传; 
布局要求: 每个`音色`是一个小卡片, 卡片的上部分是圆形`头像`, 下部分第一行是*名称+年龄文本*, 第二行是*情感文本*









## TODO
在@serve/router/ 中添加 `book/book.go`, `section/section.go`, `dubbing/dubbing.og` 把@serve/handlers.go 中的的接口拆分到以上创建的文件中


在  实现侧边栏，最上部是`logo图标`, 中间是`小说图标` 和 `配音图标`, 最下面是`设置图标`，鼠标移动到当前菜单图标显示对应的文字






## book_dubbings
/home/zdz/Documents/Try/Python/course/http-server/go_client/web/src/pages/section/Section.jsx 点击*角色配音*后Modal中的内为**上**, **下**两个部分,
**上**部分是*当前book_id在book_dubbings db中的数据*和*当前文本的角色数据*去重后的数据。**下**部分展示 /home/zdz/Documents/Try/Python/course/http-server/go_client/web/src/pages/dubbing/Dubbing.jsx 组件，但要隐藏VoiceCard中的*删除*和*编辑*，并且在VoiceCard右上角添加checkbox组建，点击后把当前VoiceCard添加到**上**部分布局中


## init
学习下 @.qwen/PROJECT_SUMMARY.md  摘要文档
