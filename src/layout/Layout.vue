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
            <router-link to="/note" active-class="active-link" class="nav-link">
                <div>笔记</div>
            </router-link>
            <router-link to="/web-clipper" active-class="active-link" class="nav-link">
                <div>剪藏</div>
            </router-link>
            <!--
            <div>密码</div>
            <div>任务</div>
            -->
            <router-link to="/tag" active-class="active-link" class="nav-link">
                <div>标签</div>
            </router-link>
            <router-link to="/settings" active-class="active-link" class="nav-link setting">
                <div>设置</div>
            </router-link>
        </div>
        <router-view></router-view>
    </main>
    <CustomModal ref="modalConfirmRef">
        <button type="button">确认</button>
    </CustomModal>
</template>
<script setup lang="ts">
import { ref, onBeforeMount } from 'vue';
import CustomModal from '@/components/CustomModal.vue';
let showAccount = ref(false);

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
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;

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
        >.nav-link {
            font-size: 14px;
            text-decoration: none;
            padding: 0.4em 0.4em;
            border-radius: 4px;
            transition: all 0.3s ease;
            color: black;
            background-color: #f0f0f0;
            box-shadow: 1px 1px 1px 1px black;
        }
        >.active-link {
            background-color: #f0f0f0;
            box-shadow: inset 1px 1px 1px 1px black;
        }
        >.setting {
            margin-top: auto;
        }
    }

}
</style>