<script setup lang="ts">
import { useHead } from '@vueuse/head';

useHead({
    titleTemplate: '%s - 专注深夜陪伴的中文有声情感电台',
    title: '白洁听书',
    meta: [
        {
            name: 'description',
            content:
                '白洁听书是一个专注于深夜陪伴的中文有声情感电台。在这里，您可以聆听高质量的中文有声小说、治愈系情感电台，让温暖的声音陪伴你的每一个深夜。',
        },
    ],
});
</script>

<template>
    <RouterView />
</template>
