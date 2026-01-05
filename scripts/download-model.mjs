import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
const FILES = [
	'config.json',
	'tokenizer.json',
	'tokenizer_config.json',
	'special_tokens_map.json',
	'onnx/model_quantized.onnx',
];

const OLD_FILES = [
	'onnx/model.onnx',
];

const BASE_URL = `https://huggingface.co/${MODEL_ID}/resolve/main/`;

async function main() {
	const targetDir = path.join(process.cwd(), 'models', 'all-MiniLM-L6-v2');
	
	console.log(`🚀 Hey Wapuu: Ensuring model files are in ${targetDir}...`);

	// Cleanup old files
	for (const file of OLD_FILES) {
		const oldPath = path.join(targetDir, file);
		if (fs.existsSync(oldPath)) {
			console.log(`🧹 Cleaning up old model file: ${file}...`);
			fs.unlinkSync(oldPath);
		}
	}

	for (const file of FILES) {
		const url = BASE_URL + file;
		const dest = path.join(targetDir, file);
		const fileDir = path.dirname(dest);

		if (!fs.existsSync(fileDir)) {
			fs.mkdirSync(fileDir, { recursive: true });
		}
		
		if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
			console.log(`✅ ${file} already exists.`);
			continue;
		}

		console.log(`📥 Downloading: ${file}...`);
		try {
			execSync(`curl -L -k -f -s -S "${url}" -o "${dest}"`, { stdio: 'inherit' });
		} catch (err) {
			console.error(`❌ Failed to download ${file}. Make sure you have an internet connection.`);
			process.exit(1);
		}
	}

	console.log('✅ BOOM! Model files are now safe and sound in the models/ folder!');
}

main().catch(console.error);
