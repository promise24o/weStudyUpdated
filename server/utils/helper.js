function toTitleCase (str) {
    return str.replace (/\b\w+/g, (word) => {
        return word.charAt (0).toUpperCase () + word.slice (1);
    });
}
