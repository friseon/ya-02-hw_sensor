отличия pointer & touch

target point - среднее значение между касаниями:
(second.pageX + first.pageX) / 2

# Qusetion:
1. Что делать если активируется больше одного Листенера? (pointer & mouse) - one touch zoom

---
#12.07 II
---
chrome (opera, yabro, vivaldi) + android chrome
edge
firefox
ie11
ios safari
---
dblClick
---
# multi-touch
выбор центральной точки
дистанция между касаниями
добавление/удаление касаний - кидать новый тач старт на новый палец
касания за пределами элемента - у поинтера нет

event({
    type:
    ..
    distance:
})

{
    x: (second - first)
}

у pointerEvents есть иные типы??? pointerType = mouse??? touch??