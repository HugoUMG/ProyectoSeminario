# Genera compartir/qr.png, compartir/tarjeta.png (para WhatsApp) y compartir/tarjeta.pdf (para imprimir).
import os, qrcode
from PIL import Image, ImageDraw, ImageFont

URL = 'https://hugoumg.github.io/ProyectoSeminario/'
os.makedirs('compartir', exist_ok=True)
F = lambda tam, negrita=False: ImageFont.truetype(r'C:\Windows\Fonts\segoeui' + ('b' if negrita else '') + '.ttf', tam)
AZUL, GRIS, NEGRO = '#1e3a8a', '#4b5563', '#111827'

qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_Q, box_size=12, border=2)
qr.add_data(URL); qr.make()
qr_img = qr.make_image(fill_color=NEGRO, back_color='white').convert('RGB')
qr_img.save('compartir/qr.png')

W, H = 1080, 1500
im = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(im)
d.rectangle([0, 0, W, 190], fill=AZUL)
d.text((W/2, 70), 'Educación Física', font=F(56, True), fill='white', anchor='mm')
d.text((W/2, 135), 'Registro de asistencia y notas', font=F(34), fill='#dbeafe', anchor='mm')

qr_r = qr_img.resize((520, 520), Image.NEAREST)
im.paste(qr_r, ((W - 520)//2, 240))
d.text((W/2, 800), 'Escanee el código o abra el enlace', font=F(32, True), fill=NEGRO, anchor='mm')
d.text((W/2, 850), URL, font=F(30), fill=AZUL, anchor='mm')

pasos = [
    ('1', 'Ábralo en Chrome, en el teléfono o en la computadora.', 'No hay que instalar ni registrarse.'),
    ('2', 'Cree un PIN de 4 a 8 dígitos.', 'Protege las notas si alguien más toma el teléfono.'),
    ('3', 'Toque "Probar con datos de ejemplo" o importe su listado.', 'Los datos quedan solo en su dispositivo.'),
]
y = 930
for n, t, s in pasos:
    d.ellipse([70, y, 130, y + 60], fill=AZUL)
    d.text((100, y + 30), n, font=F(32, True), fill='white', anchor='mm')
    d.text((160, y + 4), t, font=F(30, True), fill=NEGRO)
    d.text((160, y + 46), s, font=F(26), fill=GRIS)
    y += 130
d.rounded_rectangle([60, 1330, W - 60, 1440], radius=18, fill='#eff6ff', outline='#93c5fd', width=3)
d.text((W/2, 1362), 'En Android: menú de Chrome (los tres puntos) → "Agregar a pantalla de inicio".', font=F(26), fill=NEGRO, anchor='mm')
d.text((W/2, 1405), 'Después funciona sin internet, como una app.', font=F(26), fill=NEGRO, anchor='mm')
d.text((W/2, 1470), 'Escuela Oficial Rural Mixta "20 de Octubre" JM · San Francisco El Alto, Totonicapán', font=F(22), fill=GRIS, anchor='mm')
im.save('compartir/tarjeta.png')

# PDF carta con la tarjeta centrada
carta = Image.new('RGB', (2550, 3300), 'white')
t = im.resize((1836, 2550), Image.LANCZOS)
carta.paste(t, ((2550 - 1836)//2, (3300 - 2550)//2))
carta.save('compartir/tarjeta.pdf', resolution=300)
print('OK compartir/qr.png tarjeta.png tarjeta.pdf')
