package main

type Payment interface {
	Pay(amount float64) error
	Refund(amount float64) error
}

func Checkout(p Payment, amount float64) error {
	return p.Pay(amount)
}

func CancelOrder(p Payment, amount float64) error {
	return p.Refund(amount)
}

func main() {

}