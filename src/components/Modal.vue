<template>
    <div class="modal" v-if="showPreference">
        <div class="modal-backdrop"></div>
        <div class="modal-body">
            <div class="modal-head">
                <button class="modal-close" @click="close">close</button>
            </div>
            <slot></slot>
        </div>
    </div>
</template>
<script setup lang="ts">
import { defineExpose, ref } from "vue"

const showPreference = ref(false)
const open = () => {
    showPreference.value = true
}
const close = () => {
    showPreference.value = false
}
defineExpose({ open, close })
</script>
<style scoped lang="scss">
.modal {
    //display: block;
    z-index: 100;

    .modal-backdrop {
        z-index: 100;
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-color: rgba(0, 0, 0, 0.5);
    }

    .modal-body {
        z-index: 101;
        position: fixed;
        top: 10em;
        bottom: 10em;
        right: 30%;
        left: 30%;
        padding: 2em, 3em;
        background-color: white;
        overflow: auto;
        border-radius: 5px;

        .modal-head {
            height: 39px;
            border-bottom: 1px solid #000;

            .modal-close {
                cursor: pointer;
                position: absolute;
                top: 0.1em;
                right: 0.1em;
                padding: 0.3em;
                font-size: 2em;
                height: 1em;
                width: 1em;
                text-indent: 10em;
                overflow: hidden;
                border: 0;

                &::after {
                    position: absolute;
                    line-height: 0.5;
                    top: 0.3em;
                    left: 0.2em;
                    text-indent: 0;
                    content: "\00D7"
                }

            }
        }
    }
}
</style>