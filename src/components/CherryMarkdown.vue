<style scoped lang="scss">
//特殊样式，而不通用请在这里写样式
.cherry-container {
    position: absolute;
    top: 0px;
    right: 0px;
    bottom: 0px;
}

.toc-container {
    position: absolute;
    top: 0px;
    left: 0px;
    bottom: 0px;
    width: 260px;
    background-color: #fff;

    .toc-header {
        height: 48px;
        line-height: 48px;
        background-color: #20304b;
        text-align: center;
        font-size: 16px;
        color: #fff;
    }

    .toc-list {
        position: absolute;
        top: 60px;
        right: 0px;
        bottom: 0px;
        left: 0px;
        overflow: auto;

        &::-webkit-scrollbar {
            width: 5px;
            height: 5px;
        }

        &::-webkit-scrollbar-thumb {
            background-color: #607d8b;
            border-radius: 5px;
        }

        &::-webkit-scrollbar-thumb:hover {
            background: #40a0ff;
        }

        .toc-list-container {
            padding-top: 6px;
            cursor: pointer;
        }

        .toc-list-container:hover {
            color: red;
        }
    }
}

.top-contrl {
    position: absolute;
    top: 10px;
    right: 8px;
    height: 30px;
    padding-right: 5px;
    color: red;
    font-weight: bold;
    font-size: 20px;
    z-index: 2;
}
</style>
<template>
    <div @click.prevent.stop style="position: relative; width: 100%; height: calc(100% - 45px); z-index: 99;">

        <!-- ------- markdown组件容器 --------- -->
        <div :ref="mdId" :id="mdId" class="cherry-container scroll" :style="{ 'left': toc_visiable ? '262px' : '0px' }"></div>

        <!-- ------- 显示目录 --------- -->
        <div class="toc-container" v-show="toc_visiable">
            <div class="toc-header">目录</div>
            <div class="toc-list">
                <div v-for="(link, index) in tocList" :key="link.id" v-html="link.text" class="toc-list-container"
                    :style="{ 'padding-left': link.level * 20 + 'px' }" @click="jump(index)">
                </div>
            </div>
        </div>
        <div class="top-contrl">
            <i class="el-icon-view" v-if="!toc_visiable" @click="showToc(true)" title="显示目录"></i>
            <i class="el-icon-view" v-else @click="showToc(false)" title="隐藏目录"></i>
        </div>
    </div>
</template>

<script>
// import Axios from 'axios'
import 'cherry-markdown/dist/cherry-markdown.css';
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';
// import Cherry from 'cherry-markdown'
// import 'cherry-markdown/dist/cherry-markdown.min.css'

let cherryInstance;
export default {
    name: "sy-cherry-markdown",
    props: {
        // markdown文本
        value: {
            type: String,
            default: ''
        },
        // markdown组件容器ID
        mdId: {
            type: String,
            default: 'markdown-container'
        },
        // 用来控制目录显示或隐藏
        tocVisiable: {
            type: Boolean,
            default: false
        },
        // 编辑器的显示模式 view|edit
        display: {
            type: String,
            default: 'edit'
        },
        dirRoot: {
            type: Object,
            default: null
        }
    },
    watch: {
        value(val) {
            //console.log(val);
            this.setMarkdown(val, true);
        }
    },

    data() {
        return {
            // 编辑器的显示模式
            displayModal: this.display,

            // 用来控制目录显示或隐藏
            toc_visiable: this.tocVisiable,

            // 目录列表数组
            tocList: [],

            // markdown编辑器对象
            //cherryInstance: null,

            curTab: 0,

        };
    },
    mounted() {
        // 初始化编辑器
        this.initCherryMD();
        // 展示模式
        this.switchModel('edit');
        this.showToc(this.toc_visiable)
        this.setMarkdown(this.value, false);
    },
    beforeDestroy() {
        while (this.$refs[this.mdId].firstChild) {
            this.$refs[this.mdId].removeChild(this.$refs[this.mdId].firstChild);
        }
        cherryInstance = null
    },
    methods: {

        // 显示目录栏
        showToc(val) {
            if (val) {
                this.getTitles();
            }
            this.toc_visiable = val;
        },

        //****************************************

        /**
         * 设置markdown编辑器是浏览还是编辑状态
         * @param {Object} val {edit, view}
         */
        setDisplay(val) {
            this.displayModal = val;
            while (this.$refs[this.mdId].firstChild) {
                this.$refs[this.mdId].removeChild(this.$refs[this.mdId].firstChild);
            }
            cherryInstance = null
            this.initCherryMD();
            if (val == 'edit') {
                this.switchModel('edit&preview');
            } else {
                this.switchModel('previewOnly')
            }
        },

        /**
         * 获取文档内容中的标题目录
         */
        getTitles() {
            this.tocList = cherryInstance.getToc()
            // console.log(this.tocList)
        },

        //在某一块区域内滑动不是整个页面滑动：
        jump(index) {
            this.curTab = index;
            let anchorName = this.tocList[index].id;
            let anchorElem = document.getElementById(anchorName);
            let firstElem = document.getElementById(this.tocList[0].id);

            this.totalY = anchorElem.offsetTop - firstElem.offsetTop;
            this.distance = document.querySelector('.cherry-previewer').scrollTop;
            this.step = this.totalY / 50;
            if (this.totalY > this.distance) {
                this.smoothDown(document.querySelector('.cherry-previewer'));
            } else {
                let newTotal = this.distance - this.totalY;
                this.step = newTotal / 50;
                this.smoothUp(document.querySelector('.cherry-previewer'));
            }
        },

        // 参数element为滚动区域
        smoothDown(element) {
            if (this.distance < this.totalY) {
                this.distance += this.step;
                element.scrollTop = this.distance;
                setTimeout(this.smoothDown.bind(this, element), 2);
            } else {
                element.scrollTop = this.totalY;
            }
        },
        // 参数element为滚动区域
        smoothUp(element) {
            if (this.distance > this.totalY) {
                this.distance -= this.step;
                element.scrollTop = this.distance;
                setTimeout(this.smoothUp.bind(this, element), 2);
            } else {
                element.scrollTop = this.totalY;
            }
        },

        onScroll(e) {
            this.getTitles();
            if (!this.tocList || this.tocList.length < 1) return;

            let firstElem = document.getElementById(this.tocList[0].id);

            for (let i = this.tocList.length - 1; i >= 0; i--) {

                let anchorElem = document.getElementById(this.tocList[i].id);

                // 判断滚动条滚动距离是否大于当前滚动项可滚动距离
                let judge = e.target.scrollTop >= anchorElem.offsetTop - firstElem.offsetTop;

                if (judge) {
                    this.curTab = i;
                    break;
                }
            }
        },

        // 初始化编辑器
        initCherryMD(value) {
            const {
                afterChange,
                afterInit,
                beforeImageMounted,
                fileUpload,
                mdId,
                getDirRoot,
            } = this;
            const defaultValue = value || this.value;
            cherryInstance = new Cherry({
                id: mdId,
                value: defaultValue,
                fileUpload: fileUpload,
                callback: {
                    afterChange: afterChange,
                    afterInit: afterInit,
                    beforeImageMounted: beforeImageMounted
                },
                toolbars: {
                    showToolbar: false,
                    sidebar: ['mobilePreview', 'copy', 'theme'],
                    toolbar: [
                        'bold',
                        'italic',
                        'strikethrough',
                        '|',
                        'color',
                        'header',
                        '|',
                        'list',
                        {
                            insert: [
                                'image',
                                'audio',
                                'video',
                                'link',
                                'hr',
                                'br',
                                'code',
                                'formula',
                                'toc',
                                'table',
                                'line-table',
                                'bar-table',
                                'pdf',
                                'word',
                            ],
                        },
                        'graph',
                        'settings',
                    ],
                },
                previewer: {
                    lazyLoadImg: {
                        noLoadImgNum: 0,
                        beforeLoadOneImgCallback(img) {
                            this.changeURL(img);
                            return false;
                        },
                        async changeURL(img) {
                            const media = await getDirRoot().file.getDirectoryHandle('media');
                            const i = await media.getFileHandle(img.alt);
                            const fi = await i.getFile();
                            const s = URL.createObjectURL(fi);
                            img.src = s;
                            console.log(s);
                        },
                    }
                },
            })
        },

        /**
         * 编辑器中上传文件操作处理方法（如上传附件、粘贴截图等）
         * @param {Object} file
         */
        fileUpload(file) {
            var formData = new FormData(); //新建一个表单数据,用于提交文件
            formData.append("file", file); //添加文件,参数分别是表单参数的名字和值.
            // Axios.post("/api/common/file/upload", formData, { //使用Axios进行上传图片
            //     headers: {
            //         "Content-Type": "multipart/form-data" //设置请求头,更换内容类型为表单数据
            //     }
            // }).then((response) => { //传输之后将url替换
            //     if (response.code == 0) {
            //         let imgMdStr = `![${response.data.file_name}](${response.data.ref_url})`;
            //         console.log(imgMdStr)
            //         this.cherryInstance.insert(imgMdStr)
            //     }
            // });
        },

        /**
         * 编辑器内容变更事件回调
         * @param {Object} e
         */
        afterChange(e) {
            this.content = e
            this.getTitles()
            const mdHtml = this.getCherryHtml()
            const mdTxt = e
            const mdContent = this.getCherryContent()
            this.$emit('input', mdContent)
            //console.log('input:', mdHtml)
            this.$emit('mdChange', mdHtml, mdTxt, mdContent)
            //console.log('md-change:', mdHtml, mdTxt, mdContent)
        },

        // 初始化事件回调
        afterInit(e) {
            //console.log(e)
        },

        // 图片加载回调
        beforeImageMounted(e, src) {

            return {
                [e]: src
            }
        },

        /**
         * 设置markdown编辑器内容，全部覆盖
         * @param {Object} content 要设置的内容
         * @param {Object} keepCursor 自动设置焦点到内容
         */
        setMarkdown(content, keepCursor) {
            if (!cherryInstance) { // 未加载则重新初始化
                this.initCherryMD(content)
                return
            }
            cherryInstance.setMarkdown(content, keepCursor)
        },

        getCherryContent() {
            const result = cherryInstance.getMarkdown() // 获取markdown内容
            return result
        },
        getCherryHtml() {
            const result = cherryInstance.getHtml()
            return result
        },
        getData() {
            const result = cherryInstance.getHtml()
            return result
        },

        /**
         * type：{'pdf'|'img'}
         */
        exportMD(type = 'pdf') {
            cherryInstance.export(type)
        },

        /**
         * model{'edit&preview'|'editOnly'|'previewOnly'}
         */
        switchModel(model) {
            if (this.isInit()) {
                cherryInstance.switchModel(model)
            }
        },

        insert(content, isSelect = false, anchor = [], focus = true) {
            cherryInstance.insert(content, isSelect, anchor, focus)
        },

        isInit() {
            if (cherryInstance) {
                return true
            }
            this.$message.warning('编辑器未初始化，请检查')
            return false
        },

        getDirRoot() {
            return this.dirRoot;
        }
    },
};
</script>

