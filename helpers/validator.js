const imageTypeValidator = function(image){
    const array_of_allowed_file_types = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!array_of_allowed_file_types.includes(image.mimetype)) {
        return false;
    }

    return true;
}

const fileSizeValidator = function(file,allowed_file_size=1){
    if ((file.size / (1024 * 1024)) > allowed_file_size) {                  
        return false;
    }
    return true;
}

module.exports = {
    imageTypeValidator,
    fileSizeValidator
}