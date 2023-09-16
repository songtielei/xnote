<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'

let fileHandle;
		let contents;
		let file;

		// file picker
		async function getFileHandle() {
			const options = {
				types: [
					{
						description: "Text Files",
						accept: {
							"text/plain": [".md"]
						}
					}
				]
			};
			[fileHandle] = await window.showOpenFilePicker(options);
			file = await fileHandle.getFile();
			fileName.innerHTML = '🔥 Now you can edit ' + file.name + ' and save it to disk.';
			contents = await file.text();
			textArea.value = contents;
		}
		// write file
		async function writeFile(fileHandle, contents) {
			// Create a FileSystemWritableFileStream to write to.
			const writable = await fileHandle.createWritable();
			// Write the contents of the file to the stream.
			await writable.write(contents);
			// Close the file and write the contents to disk.
			await writable.close();
		}


		// button clicks
		getFileHandleButton.addEventListener("click", getFileHandle);
		writeFileButton.addEventListener("click", _ => {
			writeFile(fileHandle, textArea.value).
				then(function () {
					info.textContent = "🎉 Successfully saved to disk!"
				})
		});
    
</script>

<template>
  <main>
    <div class="sidebar"></div>
    <div class="nav">
      hello
    </div>
    <div class="content">
      rght
    </div>
  </main>
</template>

<style scoped lang="scss">
main {
  width: 100%;
  height: 100%;
  margin: 0;
  display: flex;
  border: solid;

  >.sidebar {
    width: 30px;
    background-color: white;
    color: #fff;
  }
  >.nav {
    width: 300px;
    background-color: #000;
    color: #fff;
  }

  >.content {
    flex: 1;
    background-color: #f5f7f9;

  }
}
</style>
