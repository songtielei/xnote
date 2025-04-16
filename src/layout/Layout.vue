<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <main>
        <div class="sidebar">
            <div class="account">
                <img src="@/assets/avatar.png" @click="() => { showAccount = !showAccount }" />
            </div>
            <div v-show="showAccount"
                style="position: absolute; left: 54px; top: 0px; width: 300px; z-index: 100; border: solid 1px; height: calc(100vh - 15px); margin: 4px; background-color: white;">
                <div>songtielei</div>
                <div>主题</div>
                <div>语言</div>
                <div class="setting">
                    设置
                </div>
                <div>退出</div>
            </div>
            <router-link to="/note">
                <div>笔记</div>
            </router-link>
            <router-link to="/web-clipper">
                <div>剪藏</div>
            </router-link>
            <!--
            <div>密码</div>
            <div>任务</div>
            -->
            <div>标签</div>

            <div class="setting" @click="openSetting">
                仓库
            </div>
        </div>
        <router-view></router-view>
    </main>

    <Modal ref="modalSettingRef">
        <Appearance />
    </Modal>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import Appearance from '@/components/ConfigAppearance.vue';
import Modal from '@/components/Modal.vue';

let showAccount = ref(false);
const modalSettingRef = ref();
const openSetting = () => {
  modalSettingRef.value.open();
}
</script>
<style scoped lang="scss">
main {
    height: 100%;
    display: flex;
    border: solid 0px;

    >.sidebar {
        position: relative;
        padding: 5px 0;
        margin: 4px;
        width: 50px;
        border-radius: 5px;
        border: solid 1px;
        height: calc(100% - 8px);
        display: flex;
        flex-direction: column;
        align-items: center;

        div {
            margin-bottom: 5px;
        }

        >.account {
            padding: 0;
            border: solid 1px;
            border-radius: 30px;
            background-color: black;
            overflow: hidden;

            >img {
                cursor: pointer;
                width: 40px;
                display: block;
                /* 阻止图片下方出现额外的空间 */
            }
        }

        >.setting {
            margin-top: auto;
            cursor: pointer;
        }
    }

}
</style>