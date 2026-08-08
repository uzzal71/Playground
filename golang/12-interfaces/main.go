package main

import "fmt"

// implemeatation golang interfaces
type Payment interface {
	Pay(amount float64) string
	Refund(amount float64) string	
}

type Nagad struct{}

func (n *Nagad) Pay(amount float64) string {
	return "Paid " + formatAmount(amount) + " using Nagad"
}

func (n *Nagad) Refund(amount float64) string {
	return "Refunded " + formatAmount(amount) + " to Nagad"
}

type Bkash struct{}

func (b *Bkash) Pay(amount float64) string {
	return "Paid " + formatAmount(amount) + " using Bkash"
}

func (b *Bkash) Refund(amount float64) string {
	return "Refunded " + formatAmount(amount) + " to Bkash"
}

type Rocket struct{}

func (r *Rocket) Pay(amount float64) string {
	return "Paid " + formatAmount(amount) + " using Rocket"
}

func (r *Rocket) Refund(amount float64) string {
	return "Refunded " + formatAmount(amount) + " to Rocket"
}

type Upay struct{}

func (u *Upay) Pay(amount float64) string {
	return "Paid " + formatAmount(amount) + " using Upay"
}

func (u *Upay) Refund(amount float64) string {
	return "Refunded " + formatAmount(amount) + " to Upay"
}

func formatAmount(amount float64) string {
	return fmt.Sprintf("%.2f", amount)
}	

func main() {
	var payment Payment

	payment = &Nagad{}
	println(payment.Pay(100.0))	// Output: Paid 100.00 using Nagad
	println(payment.Refund(50.0))  // Output: Refunded 50.00 to Nagad
}