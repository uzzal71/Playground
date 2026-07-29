package main

type Payment interface {
	Pay(amount float64) error
	Refund(amount float64) error
}

func CheckOut(p Payment, amount float64) error {
	return p.Pay(amount)
}

func CancleOrder(p Payment, amount float64) error {
	return p.Refund(amount)
}

func main() {

}