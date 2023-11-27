const path = require("node:path");
const multer = require("multer");
const crypto = require("node:crypto");

const storage = multer.diskStorage({
  destination: (req, file, cd) => {
    cd(null, path.join(__dirname, "..", "tmp"));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
    const extname = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extname);
    const sufix = crypto.randomUUID();
    cb(null, `${basename}-${sufix}${extname}`)
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
