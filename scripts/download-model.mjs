import fs from 'fs';
import path from 'path';
import https from 'https';

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
const FILES = [
	'config.json',
	'tokenizer.json',
	'tokenizer_config.json',
	'special_tokens_map.json',
	'onnx/model.onnx',
];

const BASE_URL = `https://huggingface.co/${MODEL_ID}/resolve/main/`;

async function downloadFile(url, dest) {
	const dir = path.dirname(dest);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(dest);
		https.get(url, (response) => {
			if (response.statusCode !== 200) {
				reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
				return;
			}
			response.pipe(file);
			file.on('finish', () => {
				file.close();
				resolve();
			});
		}).on('error', (err) => {
			fs.unlink(dest, () => {});
			reject(err);
		});
	});
}

async function main() {
	const targetDir = path.join(process.cwd(), 'models', 'all-MiniLM-L6-v2');
	console.log(`🚀 Hey Wapuu: Downloading model files to ${targetDir}...`);

	for (const file of FILES) {
		const url = BASE_URL + file;
		const dest = path.join(targetDir, file);
		console.log(`📥 Downloading: ${file}...`);
		await downloadFile(url, dest);
	}

	console.log('✅ BOOM! Model files are now safe and sound in the models/ folder!');
}

main().catch(console.error);

