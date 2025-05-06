
export const random = (len: number) => {
  let options = "qiprwqierq4810384hj4h314o7301hfds@$#@#%@&^**dasjlbvc,naklfhd";
  let ans = "";
  for(let i = 0; i < len; i ++) {
    let index = Math.floor(Math.random() * options.length);
    ans += options[index];
  }

  return ans;
}
