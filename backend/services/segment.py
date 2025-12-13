"""
rembg 背景移除服务
"""
from rembg import remove
from PIL import Image
import io


def remove_background(image_bytes: bytes) -> bytes:
    """
    使用 rembg 移除图片背景
    
    Args:
        image_bytes: 原始图片的字节数据
        
    Returns:
        去除背景后的 PNG 图片字节数据
    """
    input_img = Image.open(io.BytesIO(image_bytes))
    output = remove(input_img)
    
    buf = io.BytesIO()
    output.save(buf, format="PNG")
    return buf.getvalue()
