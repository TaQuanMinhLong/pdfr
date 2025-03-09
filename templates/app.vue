<script setup lang="ts">
defineProps<{ message: string; }>();
</script>

<template>
    <div>
        <p>{{ message }}</p>
    </div>
</template>

<style>
p {
    color: red;
}
</style>